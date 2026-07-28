# 🏗️ sass-combate — Arquitectura

> Fuente única de verdad sobre cómo está construido el sistema y por qué.
> El estilo visual y las convenciones de código viven en `docs/style-guide.md`.
> El detalle del schema vive en `supabase/migrations/` (ver `docs/db-notes.md`).

## 1. Stack y decisiones

| Pieza | Elección | Por qué |
|---|---|---|
| Framework | Next.js 15 (App Router) + React 19 | SSR/Server Components para no exponer el cliente de servicio de Supabase al navegador. |
| Lenguaje | TypeScript (strict) | Modelo de dominio (`src/lib/types.ts`) compartido entre emparejador, horarios y UI. |
| Estilos | Tailwind CSS 3 + CVA (`class-variance-authority`) | Componentes con variantes tipadas (`Boton`, `Badge`) sin CSS-in-JS. |
| Base de datos | Supabase (Postgres + Auth + Storage) | RLS nativo de Postgres para el aislamiento multi-tenant; Auth con Google incluido. |
| Estado servidor | TanStack Query | Cache y refetch de datos que vienen de Supabase. |
| Tablas | TanStack Table | Listas grandes (atletas, pagos) con orden/filtro en cliente. |
| Formularios | React Hook Form + Zod | Validación tipada compartida entre formulario y (potencialmente) el server action. |
| Offline | Dexie (IndexedDB) + Service Worker propio | La mesa de control y el pesaje no pueden depender de señal en el coliseo. |
| PDF | `@react-pdf/renderer` + `qrcode` | Credenciales y actas se generan en servidor, no en el cliente. |
| Testing | Vitest | Motor de emparejamiento y de horarios son funciones puras: se testean sin mocks de red. |

## 2. Regla central de datos

- El cliente **nunca** habla directo con Postgres. Todo pasa por: Server Components / Route Handlers (`src/app/api/**/route.ts`) usando `crearClienteServidor()` (`src/lib/supabase/server.ts`), o el cliente de navegador (`crearClienteNavegador()`) que igual respeta RLS con la `anon key` (nunca la `service_role`).
- **Invariante:** la `SUPABASE_SERVICE_ROLE_KEY` solo puede usarse en código de servidor. Nunca debe llegar a un componente `"use client"` ni a una respuesta JSON.
- Flujo de datos:

  ```
  Navegador → Server Component / Route Handler (crearClienteServidor)
            → Supabase (Postgres + RLS) ⇄ IndexedDB local (Dexie, solo mesa/pesaje)
  ```

- **Modo demo:** si `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` no están definidas, `HAY_SUPABASE` (`src/lib/datos.ts`) es `false` y las funciones de datos (`src/lib/auth.ts`, etc.) devuelven datos de ejemplo en vez de llamar a Supabase. Toda función nueva que lea/escriba datos debe respetar este patrón.
- **Regla para features nuevas:** si necesita datos de Supabase, el acceso se agrega en `src/lib/*.ts` (capa de consultas: `consultas.ts`, `atletas.ts`, `pagos.ts`, etc.), nunca directo dentro de un componente de página.

## 3. Mapa de rutas / endpoints

- **Públicas (sin auth):**
  - `/` — landing comercial
  - `/registro`, `/entrar` — alta y login (correo o Google)
  - `/e/[org]/[evento]` — vista pública de un evento
  - `/p/[token]` — link personal del peleador (QR)
  - `/offline` — pantalla sin señal ni cache
- **Protegidas (con sesión, middleware redirige a `/entrar` si falta):**
  - `/app`, `/app/eventos/**`, `/app/atletas`, `/app/equipo`, `/app/mi-club`, `/app/pagos`
  - `/nueva-academia`, `/mesa/[eventoId]`
- **Staff de plataforma:** `/admin` — todas las academias (verificado con `esStaff()`, RPC `es_staff` en Postgres).
- **API (PDF y sync, sin cache):**
  - `GET /api/eventos/[id]/credenciales` — credenciales con QR
  - `GET /api/eventos/[id]/acta` — acta oficial
  - `POST /api/sincronizar` — recibe la cola offline, con `Idempotency-Key`

## 4. Autenticación y autorización

- **Mecanismo:** sesión de Supabase Auth (cookies), correo/contraseña o Google OAuth. Se refresca en `src/middleware.ts` en cada request.
- **Dónde se valida:**
  - Middleware (`src/middleware.ts`): redirige `/app`, `/mesa`, `/nueva-academia` a `/entrar` si no hay usuario; redirige `/entrar`/`/registro` a `/app` si ya hay sesión. Esto es **solo conveniencia de navegación**.
  - RLS en Postgres (`supabase/migrations/20260101000002_rls_y_funciones.sql`): esto es la autorización real. Ninguna ruta de servidor debe asumir que el middleware ya filtró los datos.
- **Roles** (tabla `miembro`, jerarquía en `src/lib/auth.ts::JERARQUIA`): `dueno` > `admin` > `mesa` > `coach` > `juez` > `lector`. `puede(rol, minimo)` compara jerarquía.
- **Excepción:** en modo demo (`HAY_SUPABASE === false`) todo el mundo es `dueno` de una academia demo (`ACADEMIA_DEMO`), sin login real.

## 5. Layout de carpetas y módulos

```
src/app/                     rutas (App Router), server actions en acciones.ts
src/app/api/**/route.ts      endpoints PDF y sincronización offline
src/components/ui/           componentes base (Boton, Badge, Card, Input, Formulario)
src/lib/types.ts             modelo del dominio y cálculo de duración de pelea
src/lib/emparejador.ts       motor de emparejamiento (función pura, con pruebas)
src/lib/horarios.ts          agenda en cascada y cálculo de retraso (con pruebas)
src/lib/nivel.ts             nivel del atleta según cortes WAKO (espejo de la función SQL nivel_por_peleas)
src/lib/datos.ts             datos demo + detección de Supabase (HAY_SUPABASE)
src/lib/auth.ts              sesión, academias del usuario, jerarquía de roles
src/lib/pagos.ts             lógica de pagos y comprobantes
src/lib/atletas.ts           registro compartido de atletas entre academias
src/lib/lista-club.ts        importación de listas de alumnos por club
src/lib/pdf/documentos.tsx   plantillas @react-pdf/renderer (credenciales, acta)
src/lib/offline/db.ts        cola de operaciones e Dexie (IndexedDB)
src/lib/offline/sincronizacion.ts  reintentos con backoff hasta 30s
src/lib/supabase/client.ts   cliente Supabase de navegador
src/lib/supabase/server.ts   cliente Supabase de servidor (cookies de Next)
src/middleware.ts            subdominio de academia → ruta interna + refresco de sesión
supabase/migrations/         esquema, RLS, vistas públicas, triggers (fuente única del schema)
tests/                       pruebas de emparejador, horarios, lista-club, nivel
```

## 6. Servicios externos e integraciones

| Servicio | Para qué | Quién lo consume |
|---|---|---|
| Supabase (Postgres, Auth, Storage) | Base de datos, login, bucket `comprobantes` para pagos | `src/lib/supabase/*`, todas las rutas con sesión |
| Google OAuth (vía Supabase Auth) | Login alternativo al correo | `/entrar`, `/auth/callback` |
| — Culqi / Izipay (pendiente) | Pago con tarjeta | No integrado; el método `tarjeta` existe en el modelo pero sin pasarela real |

## 7. Variables de entorno

| Variable | Módulo que la usa | Notas |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `middleware.ts`, `lib/datos.ts`, `lib/supabase/client.ts`, `lib/supabase/server.ts` | Pública, segura de exponer al cliente. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ídem | Pública; protegida por RLS, no da acceso irrestricto. |
| `SUPABASE_SERVICE_ROLE_KEY` | (declarada en `.env.example`, aún sin uso en `src/`) | **Nunca** debe importarse desde código `"use client"` ni exponerse en una respuesta HTTP. |
| `NEXT_PUBLIC_DOMINIO_RAIZ` | `middleware.ts`, `app/nueva-academia/page.tsx` | Dominio raíz para resolver subdominios de academia (`localhost:3000` en dev). |

**Regla de seguridad:** cualquier variable sin prefijo `NEXT_PUBLIC_` no debe llegar jamás al bundle de cliente ni a JSON de respuesta.

## 8. SEO / build / despliegue

- Build estándar de Next.js (`npm run build` / `npm start`). Sin configuración de despliegue todavía (no hay `vercel.json`/`vercel.ts`, no está linkeado a Vercel).
- PWA: `public/manifest.json` + `public/sw.js` (service worker propio, sin `next-pwa`). Se registra solo en producción (`src/components/registrar-sw.tsx`).
- Sin dominio canónico ni sitemap configurados aún — el modelo es multi-tenant por subdominio, cada academia tendría su propio `academia.dominio.com`.

## 9. Diagrama general

```
                    ┌─────────────────────────────┐
                    │   Navegador (Next.js RSC)    │
                    │  IndexedDB (Dexie, offline)  │
                    └───────────┬─────────────────┘
                                │ cookies de sesión
                    ┌───────────▼─────────────────┐
                    │  middleware.ts                │
                    │  - refresca sesión Supabase   │
                    │  - subdominio → /e/[org]      │
                    │  - protege /app /mesa /admin  │
                    └───────────┬─────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
 Server Components      Route Handlers /api/**    Server Actions
 (crearClienteServidor)  (PDF, /api/sincronizar)   (acciones.ts)
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                ▼
                    ┌─────────────────────────────┐
                    │   Supabase (Postgres + RLS)  │
                    │   Auth · Storage (comprobantes)│
                    └─────────────────────────────┘
```

## 10. Invariantes arquitectónicos ("no romper")

- **Las horas no se escriben, se calculan.** `construirAgenda` (`src/lib/horarios.ts`) parte de la hora de inicio de cada área y suma duraciones; nunca debe aparecer un campo de hora editable a mano.
- **El subdominio no es seguridad.** El middleware solo resuelve qué organización se mira. La autorización real vive en RLS.
- **El emparejador propone, el organizador decide.** Nunca crea peleas directamente.
- **El registro de atletas es compartido entre academias a propósito** (tabla `atleta`, identificada por documento) para evitar que un peleador con historial se inscriba como debutante en otra academia. El detalle de cada evento sigue siendo privado por organización; solo el resumen (`v_resumen_atleta`) es compartido.
- **El nivel del atleta** se calcula igual en `src/lib/nivel.ts` y en la función SQL `nivel_por_peleas` — deben mantenerse sincronizados si cambian los cortes WAKO.
- **No importar `service_role` ni el cliente de servidor en código `"use client"`.**
- **Toda operación offline lleva `Idempotency-Key`** y el servidor hace upsert por `pelea_id`; nunca asumir que una operación llega una sola vez.
