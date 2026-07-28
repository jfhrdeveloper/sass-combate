# Guía de estilo

> Fuente única de verdad para estilo visual y convenciones de código. No duplicar en CLAUDE.md.

## Tipografía
- Familia(s): sin fuente personalizada declarada; usa la fuente por defecto del sistema (`sans-serif` del navegador). No hay `next/font` configurado en `src/app/layout.tsx`.
- Escala / tamaños: clases de Tailwind directas por componente (`text-sm`, `text-lg`, `text-2xl` en `Boton`, por ejemplo). No hay una escala tipográfica centralizada todavía.
- Pesos y usos: `font-medium` en botones, `font-semibold` en el tamaño `mesa` (pantalla de mesa de control, texto grande para uso con guantes/distancia).

## Paleta
Definida en `tailwind.config.ts` como colores con nombre en español (`extend.colors`):

| Token | Valor HSL | Uso |
|---|---|---|
| `borde` | `hsl(214 20% 88%)` | Bordes de tarjetas, inputs, variante `contorno` |
| `panel` | `hsl(0 0% 100%)` | Fondo de tarjetas/paneles |
| `fondo` | `hsl(210 20% 98%)` | Fondo general del body |
| `roja` | `hsl(0 72% 45%)` | Esquina roja / acciones destructivas o de alerta |
| `azul` | `hsl(214 80% 45%)` | Esquina azul / acciones primarias alternas |

- Estados (éxito / aviso / error / info): no hay tokens dedicados aún; se usan utilidades de Tailwind sueltas (`text-slate-900`, etc.) donde hace falta. Pendiente formalizar.
- Modo oscuro: no implementado (`color-scheme: light` fijo en `globals.css`).
- **Regla:** nunca redefinir `roja`/`azul`/`borde`/`panel`/`fondo` con valores hex sueltos en componentes; siempre usar las clases de Tailwind generadas desde `tailwind.config.ts`.

## Espaciado y breakpoints
- Escala de espaciado: la por defecto de Tailwind, sin extensión custom.
- Grid / contenedores: no hay un contenedor centralizado (`max-w-*` + `mx-auto`) definido como componente reutilizable; se aplica ad-hoc por página.

### Breakpoints (mobile-first)
Diseña primero para móvil y escala hacia arriba. Breakpoints estándar de Tailwind (el proyecto no los sobreescribe):

| Nivel    | Breakpoint | Dispositivo objetivo   | Regla base de layout                                          |
| :------- | :--------- | :--------------------- | :----------------------------------------------------------- |
| **base** | `< 640px`  | Móvil (360–430px)      | 1 columna, touch targets ≥ 44px (crítico en mesa de control y pesaje) |
| **sm**   | `≥ 640px`  | Móvil grande / paisaje | 1 columna con márgenes holgados                              |
| **md**   | `≥ 768px`  | Tablet (768–1024px)    | Grid de 2 columnas; sidebar en overlay/colapsable           |
| **lg**   | `≥ 1024px` | Laptop 13–14"          | Sidebar fijo; grid de 2–3 columnas                          |
| **xl**   | `≥ 1280px` | Laptop 15–16"          | Grid de ≥ 3 columnas sin scroll horizontal                  |
| **2xl**  | `≥ 1536px` | Monitor 17"+           | Contenido centrado con tope de ancho; no estirar al 100%    |

### Reglas de responsive
- **Anchos:** nunca px fijos en contenedores; usar `w-full` + `max-w-*`.
- **Imágenes:** siempre `w-full h-auto` u `object-cover`.
- **Tipografía:** responsiva por breakpoint, nunca tamaños fijos que no escalen.
- **Mesa de control y pesaje** son pantallas usadas en el borde de un ring/tatami, a veces con guantes puestos o desde el celular: priorizar el tamaño `mesa` (`h-24 px-6 text-2xl`) de `Boton` para las acciones críticas en esas rutas.

## Componentes UI
Los componentes base viven en `src/components/ui/` (`badge.tsx`, `button.tsx`, `card.tsx`, `formulario.tsx`, `input.tsx`), construidos con `class-variance-authority` (`cva`) + `cn` (`clsx` + `tailwind-merge`, en `src/lib/utils.ts`).

- **Botones (`Boton`, en `button.tsx`):**
  - Variantes: `solido` (default), `contorno`, `roja`, `azul`, `fantasma`.
  - Tamaños: `sm`, `md` (default), `lg`, `mesa` (pantallas de mesa de control, ver arriba).
- **Formularios e inputs:** `react-hook-form` + `@hookform/resolvers` + `zod` para validación; componentes en `formulario.tsx` e `input.tsx`.
- **Modales / overlays:** no hay un componente propio todavía; agregar aquí cuando se cree.
- **Tablas / listas:** `@tanstack/react-table` para tablas con datos (ver `src/app/app/atletas/page.tsx` y similares).
- **Clases globales reutilizables:** centralizar en `globals.css` cualquier patrón que se repita en 3+ componentes; no redeclarar las mismas utilidades de Tailwind una y otra vez.

## Animación
- Librería: ninguna (solo `transition-colors` de Tailwind en `Boton`).
- **Duraciones y easings estándar:** no hay una convención declarada; si se agregan animaciones, definir una transición base y reutilizarla en vez de esparcir duraciones ad-hoc.
- **`prefers-reduced-motion`:** no aplica todavía (no hay animaciones grandes); tenerlo en cuenta si se agregan.

## Accesibilidad
- **Contraste mínimo:** WCAG AA (4.5:1 texto normal, 3:1 texto grande). Revisar en especial `roja`/`azul` sobre `panel`/`fondo`.
- **Foco visible / navegación por teclado:** no quitar el `outline` de foco sin un reemplazo equivalente; los botones de `mesa` deben ser operables por teclado además de touch.
- **Etiquetas ARIA y roles:** usar `button`/`a`/`label` nativos antes que `div` con rol.
- **Touch targets:** ≥ 44px en móvil — ya cumplido por el tamaño `mesa` (`h-24`), pero revisar los tamaños `sm`/`md` en pantallas táctiles (pesaje, mesa).
- **Zoom del usuario:** `src/app/layout.tsx` define `viewport` con `initialScale: 1` pero **sin** `maximum-scale`, por lo que el usuario sí puede hacer zoom manual — correcto, no tocar salvo necesidad concreta.

## Convenciones de código

### Estándar visual de comentarios
Aplica esta jerarquía en archivos nuevos para una legibilidad consistente (el código existente es mayormente sin comentarios o con notas puntuales tipo JSDoc, ver `src/lib/auth.ts`):

- **Nivel 1 (Bloques principales):** `/* ================= BLOQUE PRINCIPAL ================= */`
- **Nivel 2 (Secciones lógicas):** `/* ====== Sección secundaria ====== */`
- **Nivel 3 (Subsecciones):** `/* ==== Subsección ==== */`
- **Nivel 4 (Notas de una línea):** `// Nota específica` o `/* Elemento adicional */`
- En SQL (`supabase/migrations/`) usar `--`.

> **⚠️ Regla crítica (React/JSX):** dentro del JSX (en el `return`) usa **ÚNICA Y ESTRICTAMENTE** `{/* ... */}`. Un `//` dentro del JSX rompe la aplicación.

### Tono de los comentarios
El comentario describe **qué hace / por qué existe** el código, en presente atemporal — como ya se ve en `src/lib/auth.ts` ("Esto es comodidad de navegación, no seguridad...") y `src/middleware.ts` ("Traduce el subdominio... Solo resuelve QUE organización se está mirando"). **No** narra quién lo escribió ni cuándo: eso vive en el git log / `docs/pending-task.md`.

> Distingue por tipo de texto: **comentarios de código** → presente atemporal; **bitácora** (`pending-task.md`) → pasado impersonal ("se agregó", "se verificó"); **`architecture.md`** → presente descriptivo del sistema.

### Otras convenciones
- **Idioma:** todo el dominio (variables, funciones, tablas, rutas) está en español — mantenerlo así por consistencia (`peleador`, `inscripcion`, `emparejador`, `exigirAcademia`, etc.). No mezclar con nombres en inglés salvo términos técnicos estándar (`route.ts`, `page.tsx`, props de React).
- **Imports:** alias `@/*` → `./src/*` (definido en `tsconfig.json`); usarlo siempre en vez de rutas relativas largas (`../../lib/...`).
- **Server vs cliente Supabase:** `src/lib/supabase/server.ts` (Server Components/Route Handlers) vs `src/lib/supabase/client.ts` (`"use client"`) — no mezclar, cada uno tiene su propio manejo de cookies.
- **Modo demo:** cualquier función de datos debe respetar el patrón de `HAY_SUPABASE` (`src/lib/datos.ts`) — si no hay Supabase configurado, devolver datos de ejemplo en vez de fallar.

## Reglas generales (hardening web/móvil)
Buenas prácticas base a mantener en este proyecto (mesa de control y pesaje se usan en el borde del tatami/ring, muchas veces en celular):

- **Sin zoom automático al tocar inputs (iOS).** Verificar que los inputs de `pesaje` y `mesa` mantengan `font-size` ≥ 16px (`input, textarea, select { font-size: max(16px, 1em); }`), para que iOS no haga auto-zoom.
- **Sin scroll horizontal accidental.** Envolver las tablas de `@tanstack/react-table` (atletas, pagos) en contenedores `overflow-x: auto`.
- **`box-sizing: border-box`** — verificar que esté global (Tailwind lo aplica vía `preflight`, no desactivar `preflight`).
- **Inputs numéricos sin spinners** en peso/edad/rondas donde el ingreso es manual.
- **Anti-flash de tema:** no aplica mientras no haya modo oscuro.
- **NUNCA deshabilitar el zoom del usuario** — ya se respeta (ver Accesibilidad arriba).

## Anti-patrones
- **No** redefinir `roja`/`azul`/`borde`/`panel`/`fondo` con valores hex sueltos; usar los tokens de `tailwind.config.ts`.
- **No** usar anchos fijos en px para contenedores; usar `w-full` + `max-w-*`.
- **No** usar `//` dentro del JSX (en el `return`); solo `{/* ... */}`.
- **No** escribir un campo de hora editable a mano en el modelo de eventos/peleas: las horas se calculan (`construirAgenda` en `src/lib/horarios.ts`), nunca se escriben directamente — ver `docs/architecture.md` §10.
- **No** hacer que el emparejador (`src/lib/emparejador.ts`) cree peleas directamente: solo propone, el organizador decide.
- **No** confundir el middleware de subdominio con seguridad: la autorización real vive en las políticas RLS de Postgres.
