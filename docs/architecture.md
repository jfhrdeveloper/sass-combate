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
  - `/terminos`, `/privacidad`, `/libro-de-reclamaciones` — legales, enlazadas desde el footer de la landing
  - `/offline` — pantalla sin señal ni cache
- **Protegidas (con sesión, middleware redirige a `/entrar` si falta):**
  - `/app`, `/app/eventos/**`, `/app/atletas`, `/app/equipo`, `/app/mi-club`, `/app/pagos`, `/app/plan`
  - `/nueva-academia`, `/mesa/[eventoId]`
- **Staff de plataforma:** `/admin`, `/admin/reclamos` — todas las academias y el Libro de Reclamaciones (verificado con `esStaff()`, RPC `es_staff` en Postgres).
- **API (PDF y sync, sin cache):**
  - `GET /api/eventos/[id]/credenciales` — credenciales con QR
  - `GET /api/eventos/[id]/acta` — acta oficial
  - `POST /api/sincronizar` — recibe la cola offline, con `Idempotency-Key`; el caso `resultado` dispara `recalcular_horarios` y luego `avisarPeleasCercanas`
  - `POST /api/pagos/culqi` — cobra la inscripción de un peleador con tarjeta y aprueba el pago si Culqi confirma el cargo
  - `POST /api/pagos/plan` — cobra un plan de sass-combate (no una inscripción) con tarjeta y activa `organizacion.plan`/`plan_vence_en` hasta el fin del período pagado
  - `POST /api/notificaciones/suscribir` — guarda la suscripción push que se generó en `/p/[token]`

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
src/components/ui/           componentes base (Boton, Badge, Card, Input, Formulario, TarjetaPelea)
src/components/nav-landing.tsx, footer-landing.tsx   navbar/footer de la landing y páginas legales
src/components/theme-toggle.tsx                      botón claro/oscuro (persiste en localStorage)
src/lib/types.ts             modelo del dominio y cálculo de duración de pelea
src/lib/emparejador.ts       motor de emparejamiento (función pura, con pruebas)
src/lib/horarios.ts          agenda en cascada y cálculo de retraso (con pruebas)
src/lib/nivel.ts             nivel del atleta según cortes WAKO (espejo de la función SQL nivel_por_peleas)
src/lib/datos.ts             datos demo + detección de Supabase (HAY_SUPABASE)
src/lib/auth.ts              sesión, academias del usuario, jerarquía de roles
src/lib/pagos.ts             lógica de pagos y comprobantes
src/lib/pagos/culqi.ts       llamada REST al cargo de Culqi (pago con tarjeta), reusada por inscripciones y por /app/plan
src/lib/reclamos.ts          Libro de Reclamaciones: crear (público), listar/responder (staff)
src/lib/planes.ts            límites del plan Gratis (eventos/inscritos) y si un plan pagado sigue vigente
src/lib/publico.ts           datos de /e/[org]/[evento] y /p/[token] (vistas anon / token + service_role)
src/lib/atletas.ts           registro compartido de atletas entre academias
src/lib/lista-club.ts        importación de listas de alumnos por club
src/lib/notificaciones/      aviso al peleador (email/SMS/WhatsApp/push) cuando su pelea se acerca
src/lib/pdf/documentos.tsx   plantillas @react-pdf/renderer (credenciales, acta)
src/lib/offline/db.ts        cola de operaciones e Dexie (IndexedDB)
src/lib/offline/sincronizacion.ts  reintentos con backoff hasta 30s
src/lib/supabase/client.ts   cliente Supabase de navegador
src/lib/supabase/server.ts   cliente Supabase de servidor (cookies de Next)
src/lib/supabase/admin.ts    cliente `service_role` (solo rutas de servidor ya verificadas)
src/middleware.ts            subdominio de academia → ruta interna + refresco de sesión
supabase/migrations/         esquema, RLS, vistas públicas, triggers (fuente única del schema)
tests/                       pruebas de emparejador, horarios, lista-club, nivel
```

## 6. Servicios externos e integraciones

| Servicio | Para qué | Quién lo consume |
|---|---|---|
| Supabase (Postgres, Auth, Storage) | Base de datos, login, bucket `comprobantes` para pagos | `src/lib/supabase/*`, todas las rutas con sesión |
| Google OAuth (vía Supabase Auth) | Login alternativo al correo | `/entrar`, `/auth/callback` |
| Culqi | Pago con tarjeta (checkout tokeniza en el navegador, el cargo se crea en el servidor). Dos usos independientes: inscripción de un peleador (`pago`/`pago_inscripcion`) y plan de sass-combate (`organizacion.plan`) | `src/app/app/mi-club/pago-tarjeta.tsx` + `/api/pagos/culqi` (inscripción); `src/app/app/plan/selector-plan.tsx` + `/api/pagos/plan` (plan); ambos sobre `src/lib/pagos/culqi.ts` |
| Resend | Email al peleador cuando su pelea se acerca | `src/lib/notificaciones/proveedores/email.ts` |
| Twilio | SMS y WhatsApp al peleador cuando su pelea se acerca | `src/lib/notificaciones/proveedores/twilio.ts` |
| Web Push (VAPID, sin proveedor externo) | Push web al peleador cuando su pelea se acerca | `src/lib/notificaciones/proveedores/push.ts`, opt-in en `/p/[token]`, entrega en `public/sw.js` |

Las cuatro integraciones de notificación son independientes entre sí: cada una se activa sola con sus propias variables de entorno (§7) y si faltan, ese canal queda inactivo sin romper los demás ni el resto de la app (mismo patrón que `HAY_SUPABASE`). El disparo ocurre en `avisarPeleasCercanas()` (`src/lib/notificaciones/index.ts`), llamado desde `/api/sincronizar` justo después de `recalcular_horarios` — no hay cron: la mesa registrando resultados todo el día ya recalcula horarios con frecuencia suficiente. `notificacion_enviada` evita reenviar el mismo aviso.

**`/p/[token]` y `/e/[org]/[evento]` ya leen datos reales** (`src/lib/publico.ts`) cuando hay Supabase, no solo el opt-in de push. `/e/[org]/[evento]` resuelve org+evento contra las vistas `v_publico_evento`/`v_publico_area`/`v_publico_pelea`/`v_publico_bloque` (abiertas a `anon`, filtradas por `evento.publico`), y les da forma de `Area[]`/`Pelea[]`/`Bloque[]` para reusar `construirAgenda()` sin duplicar la lógica de horarios. `/p/[token]` resuelve el token con `service_role` (igual que `/api/notificaciones/suscribir`: el token ya autoriza ver esa pelea sin sesión) y ahí sí busca la pelea propia del peleador (antes mostraba la primera pelea sin terminar de todo el evento, sin usar el token para nada más que el título).

## 7. Variables de entorno

| Variable | Módulo que la usa | Notas |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `middleware.ts`, `lib/datos.ts`, `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts` | Pública, segura de exponer al cliente. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ídem | Pública; protegida por RLS, no da acceso irrestricto. |
| `SUPABASE_SERVICE_ROLE_KEY` | `lib/supabase/admin.ts` (`crearClienteServicio`), usado en `/api/pagos/culqi` y `/api/notificaciones/suscribir` | **Nunca** debe importarse desde código `"use client"` ni exponerse en una respuesta HTTP. Se usa solo cuando el servidor ya verificó algo por su cuenta (un cargo de Culqi confirmado, un token de inscripción válido) y necesita saltar una política de RLS pensada para personas, no para el sistema. |
| `NEXT_PUBLIC_DOMINIO_RAIZ` | `middleware.ts`, `app/nueva-academia/page.tsx` | Dominio raíz para resolver subdominios de academia (`localhost:3000` en dev). |
| `CULQI_SECRET_KEY` | `lib/pagos/culqi.ts` (servidor) | Nunca al cliente. |
| `NEXT_PUBLIC_CULQI_PUBLIC_KEY` | `pago-tarjeta.tsx` (Checkout.js) | Pública por diseño de Culqi. |
| `RESEND_API_KEY`, `RESEND_FROM` | `lib/notificaciones/proveedores/email.ts` | Sin `RESEND_API_KEY`, el canal email queda inactivo. |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_SMS_FROM`, `TWILIO_WHATSAPP_FROM` | `lib/notificaciones/proveedores/twilio.ts` | SMS y WhatsApp se activan por separado según qué `_FROM` esté presente. |
| `VAPID_PRIVATE_KEY` | `lib/notificaciones/proveedores/push.ts` (servidor) | Nunca al cliente; generar el par con `npx web-push generate-vapid-keys`. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ídem (servidor, para firmar) y `activar-notificaciones.tsx` (cliente, para suscribirse) | Misma clave pública en ambos lados; es pública por diseño de Web Push. |

**Regla de seguridad:** cualquier variable sin prefijo `NEXT_PUBLIC_` no debe llegar jamás al bundle de cliente ni a JSON de respuesta.

## 8. SEO / build / despliegue

- Build estándar de Next.js (`npm run build` / `npm start`). Sin configuración de despliegue todavía (no hay `vercel.json`/`vercel.ts`, no está linkeado a Vercel).
- PWA: `public/manifest.json` + `public/sw.js` (service worker propio, sin `next-pwa`). Se registra solo en producción (`src/components/registrar-sw.tsx`).
- **SEO** (`src/lib/seo.ts` centraliza `URL_BASE`/`urlEvento`/`desdeSlug`):
  - `src/app/sitemap.ts` — rutas públicas estáticas siempre; si hay Supabase, agrega cada evento con `evento.publico = true` leyendo `v_publico_pelea` (ya filtra por ese flag y está abierta a `anon`).
  - `src/app/robots.ts` — bloquea `/app`, `/mesa`, `/admin`, `/nueva-academia`, `/api` y `/p/` (credencial personal, no es contenido público); referencia el sitemap.
  - `robots: { index: false, follow: false }` explícito además en cada ruta privada/personal (el layout de `/app`, `/admin`, `/mesa/[eventoId]`, `/nueva-academia`, `/p/[token]`) — doble seguro sobre el robots.txt.
  - Metadata por página (`generateMetadata` donde el contenido es dinámico) en la landing y en `/e/[org]/[evento]`: título/descripción reales, Open Graph, Twitter Card y JSON-LD `SportsEvent` en el evento público.
  - Imágenes Open Graph dinámicas con `next/og` (`opengraph-image.tsx` en la raíz y en `/e/[org]/[evento]`) — sin arte estático, se generan en el momento a partir del contenido real.
  - `generateMetadata` de `/e/[org]/[evento]` ya usa el nombre/fecha/sede reales del evento (vía `obtenerAgendaPublica`, §6) en vez de derivarlos del slug de la URL.
- Sin dominio canónico propio todavía — el modelo es multi-tenant por subdominio (cada academia en `academia.dominio.com`); `urlEvento()` ya arma esa URL para producción y cae a `/e/[org]/[evento]` en local.

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
- **`service_role` (`crearClienteServicio()`) solo se usa cuando el servidor ya verificó algo por su cuenta** (un cargo de Culqi confirmado, un token de inscripción resuelto) y necesita aprobar en nombre del sistema, saltando una política de RLS pensada para que apruebe una persona (dueño/admin). Nunca se usa para responder a una lectura/escritura normal a pedido del usuario — eso sigue yendo por `crearClienteServidor()`, respetando RLS.
- **Toda operación offline lleva `Idempotency-Key`** y el servidor hace upsert por `pelea_id`; nunca asumir que una operación llega una sola vez.
- **Los avisos al peleador (`notificacion_enviada`) son idempotentes por diseño**: un mismo aviso no se reenvía dos veces así se reintente el recálculo de horarios; un canal sin configurar (falta su variable de entorno) queda inactivo sin afectar a los demás.
- **Un plan de sass-combate es un cobro único por período (`organizacion.plan_vence_en`), no una suscripción recurrente.** No hay tokens de tarjeta guardados ni webhooks de renovación — al vencer, la academia sigue existiendo pero vuelve a los límites de `free`. Si se implementa cobro recurrente real más adelante, es trabajo aparte (ver `docs/pending-task.md`), no algo que este campo ya resuelve.
- **Los límites del plan Gratis sí se aplican, no son solo texto en `/#precios`.** `src/lib/planes.ts::planEstaActivo(plan, plan_vence_en)` decide si una academia sigue teniendo un plan pagado vigente (no alcanza con que `plan` no sea `"free"`: si `plan_vence_en` ya pasó, vale como Gratis). `crearEvento` (`src/app/acciones.ts`) bloquea el segundo evento activo; el caso `inscripcion` de `/api/sincronizar` bloquea la inscripción 41 de un evento. Cualquier límite nuevo de plan debe pasar por ese mismo helper, no repetir la comparación a mano.
