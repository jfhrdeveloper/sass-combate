# Guía de estilo

> Fuente única de verdad para estilo visual y convenciones de código. No duplicar en CLAUDE.md.

## Tipografía
- Familias (`next/font/google` en `src/app/layout.tsx`, expuestas como `--font-display`/`--font-body` y `font-display`/`font-body` en Tailwind):
  - **Barlow Condensed** (`font-display`) — títulos (`h1`/`h2`/`h3`, regla global en `globals.css`), botones (`Boton`), números de marcador (`TarjetaDato`, `TarjetaPelea`, horas), insignias de estado (`Insignia`). Es la tipografía de cartelera de pelea/tabla de posiciones: condensada, en mayúsculas en los botones tamaño `mesa` y en las insignias de estado, normal en el resto.
  - **Inter** (`font-body`) — texto de párrafo, tablas de datos, formularios. Es el `body` por defecto (`globals.css`).
  - **Regla:** no mezclar tipografías fuera de este esquema; si un elemento es un título, un botón, un número destacado o una insignia de estado, usa `font-display` (ya viene incluido en `Boton`/`TarjetaDato`/`Insignia`/`h1`-`h3`); todo lo demás hereda `font-body` del `body`.
- Escala / tamaños: clases de Tailwind directas por componente (`text-sm`, `text-lg`, `text-2xl` en `Boton`, por ejemplo). No hay una escala tipográfica centralizada todavía.
- Pesos y usos: `font-semibold` en botones y números destacados; tamaño `mesa` de `Boton` además va en mayúsculas (`uppercase`) para lectura a distancia/con guantes.

## Paleta
Definida en `tailwind.config.ts` como colores con nombre en español (`extend.colors`):

| Token | Valor HSL | Uso |
|---|---|---|
| `borde` | `hsl(214 20% 88%)` | Bordes de tarjetas, inputs, variante `contorno` |
| `panel` | `hsl(0 0% 100%)` | Fondo de tarjetas/paneles |
| `fondo` | `hsl(210 20% 98%)` | Fondo general del body |
| `roja` | `hsl(0 72% 45%)` | Esquina roja / acciones destructivas o de alerta |
| `azul` | `hsl(214 80% 45%)` | Esquina azul / acciones primarias alternas |
| `exito` / `exito-suave` / `exito-fuerte` | `hsl(160 84% 39%)` / `hsl(149 80% 92%)` / `hsl(163 88% 20%)` | Estado de éxito (pago aprobado, pesaje correcto, sincronizado) |
| `aviso` / `aviso-suave` / `aviso-fuerte` | `hsl(38 92% 50%)` / `hsl(48 96% 89%)` / `hsl(23 83% 31%)` | Estado de aviso (pendiente, modo demo, por pagar) |
| `error` / `error-suave` / `error-fuerte` | `hsl(350 89% 60%)` / `hsl(356 100% 95%)` / `hsl(347 77% 37%)` | Estado de error (rechazado, derrota, con errores de sync) |
| `info` / `info-suave` / `info-fuerte` | `hsl(199 89% 48%)` / `hsl(204 94% 94%)` / `hsl(202 80% 24%)` | Estado informativo (sincronizando, exhibición) |

- Cada token de estado tiene tres variantes: `DEFAULT` (sólido, para puntos/bordes), `-suave` (fondo tenue) y `-fuerte` (texto oscuro sobre el fondo suave) — mismo patrón que `bg-aviso-suave text-aviso-fuerte`.
- **Regla:** no usar clases sueltas de Tailwind (`bg-amber-100`, `text-emerald-800`, etc.) para estados; siempre los tokens `exito`/`aviso`/`error`/`info` de arriba.
- **Regla:** nunca redefinir `roja`/`azul`/`borde`/`panel`/`fondo`/`exito`/`aviso`/`error`/`info` con valores hex sueltos en componentes; siempre usar las clases de Tailwind generadas desde `tailwind.config.ts`.

### Modo oscuro
Implementado con la estrategia `class` de Tailwind (`darkMode: "class"` en `tailwind.config.ts`):

- Cada token de color (`borde`, `panel`, `fondo`, `roja`, `azul`, `exito`/`aviso`/`error`/`info` y sus `-suave`/`-fuerte`) lee de una variable CSS definida en `:root` (claro) y `.dark` (oscuro) en `globals.css` — por eso alternar la clase `.dark` en `<html>` cambia toda la app sin tocar componentes.
- En los chips de estado (`bg-X-suave text-X-fuerte`), el oscuro **intercambia qué tono es fondo y cuál es texto** (fondo oscuro saturado + texto claro del mismo tono), no invierte colores planos — así el chip sigue siendo legible.
- Los valores de `roja`/`azul` en oscuro se recalcularon verificando contraste WCAG real (contra blanco, contra `fondo` oscuro y contra `panel` oscuro), no a ojo — ver el histórico de la sesión en `docs/pending-task.md` si hace falta reajustarlos.
- **`ThemeToggle`** (`src/components/theme-toggle.tsx`) alterna `document.documentElement.classList` y guarda la preferencia en `localStorage` (`"tema"`). Un script inline en `src/app/layout.tsx` aplica el tema guardado (o `prefers-color-scheme` si no hay preferencia) antes del primer paint, para no parpadear.
- **Regla:** cualquier color nuevo debe pensarse para los dos temas a la vez (no solo agregar un `dark:` suelto sin revisar contraste); si es un color de marca/estado, agregarlo como variable CSS en `globals.css` en vez de una utilidad de Tailwind cableada.
- **Pendiente:** el modo oscuro está completo en la landing, páginas legales y en los componentes compartidos (`Boton`, `Tarjeta`, `Insignia`, `Campo`, `TarjetaPelea`); el resto de `/app` hereda los tokens automáticamente. Se corrigieron los casos más visibles (botones que reinventaban el variante `solido` sin el swap oscuro, chips `bg-slate-100`/`text-slate-900` sueltos en el dashboard, atletas, pesaje y emparejamiento — ver bitácora de 2026-07-29), pero un `text-slate-500`/`600` suelto sin `dark:` en texto secundario de página sigue apareciendo en varios lugares de `/app` que no se tocaron; seguir usando `TarjetaTitulo`/`Insignia`/`estilos()` en vez de clases sueltas al tocar esas páginas.

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
Los componentes base viven en `src/components/ui/` (`badge.tsx`, `button.tsx`, `card.tsx`, `formulario.tsx`, `input.tsx`, `tarjeta-pelea.tsx`), construidos con `class-variance-authority` (`cva`) + `cn` (`clsx` + `tailwind-merge`, en `src/lib/utils.ts`).

- **Botones (`Boton`, en `button.tsx`):**
  - Variantes: `solido` (default), `contorno`, `roja`, `azul`, `fantasma`.
  - Tamaños: `sm`, `md` (default), `lg`, `mesa` (pantallas de mesa de control, ver arriba; además va en mayúsculas).
- **`TarjetaPelea` (`tarjeta-pelea.tsx`):** la firma visual de la plataforma — el enfrentamiento roja/azul, con roja alineada a la derecha y azul a la izquierda mirándose (como un cartel de pelea real), separadas por una marca "vs". Tamaños `sm`/`md`/`lg`. Se usa en mesa de control, emparejamiento, el evento público y la credencial personal — siempre que se muestre un cruce, usar este componente en vez de armar el layout a mano. **Cuidado con `lg` en contenedores angostos** (menos de ~400px): con nombres largos trunca; en esos casos usar `md`.
- **Insignias de estado (`Insignia`, en `badge.tsx`):** `font-display`, mayúsculas, `tracking-wide` — mismo lenguaje visual en toda la plataforma para cualquier chip de estado. Cubre tanto `pelea.estado`/`evento.estado` como el resultado de una pelea en el historial de un atleta (`victoria`/`derrota`/`empate`/`exhibicion`/`no_disputada`). **No** todo chip de color es un estado: el nivel de un atleta, un puntaje de emparejamiento o una acción de auditoría (`Creado`/`Modificado`/`Eliminado`, vocabulario propio, ver comentario en `auditoria/page.tsx`) tienen su propio significado y no deben forzarse dentro de `Insignia`.
- **Formularios e inputs:** `react-hook-form` + `@hookform/resolvers` + `zod` para validación; componentes en `formulario.tsx` e `input.tsx`.
- **Casillas desplegables (`Select`, en `select.tsx`):** envoltorio propio sobre `@radix-ui/react-select` (no shadcn/ui completo, solo el primitivo, con los tokens de color del proyecto en vez del theme por defecto de shadcn). **Regla:** nunca un `<select>` nativo del navegador — la flecha de un `<select>` nativo queda pegada al borde derecho; `SelectTrigger` siempre reserva espacio propio (`pr-9` + ícono en `right-3`, nunca `right-0`). Participa en formularios nativos vía su prop `name` (Radix genera un `<select>` oculto para el `FormData`); si el valor "vacío"/"cualquiera" es una opción real (no un placeholder), usar un valor centinela no vacío (ej. `"todos"`) y traducirlo a `undefined` en el server action — Radix no permite `value=""` en un `SelectItem`.
- **Modales / overlays (`Dialog`, en `dialog.tsx`):** mismo criterio que `Select`, envoltorio propio sobre `@radix-ui/react-dialog`. Usar para confirmaciones de eliminar/acciones destructivas, no para formularios largos (ahí una sección expandible o una página aparte sigue siendo mejor).
- **Tablas / listas:** `@tanstack/react-table` está instalado pero todavía no se usa en ningún componente — hoy las listas son `.map()` simple. Cualquier lista de **más de 8 elementos** pagina con `paginar()` (`src/lib/paginacion.ts`) + `<Paginador>` (`src/components/ui/paginador.tsx`, sin JS de cliente: navega por `?page=`) — ver `src/app/app/atletas/page.tsx`, `pagos/page.tsx`, `mi-club/page.tsx`, `admin/reclamos/page.tsx` y `app/page.tsx`. Los contadores de tarjetas/resúmenes siempre se calculan sobre la lista completa, nunca sobre la página visible.
- **Clases globales reutilizables:** centralizar en `globals.css` cualquier patrón que se repita en 3+ componentes; no redeclarar las mismas utilidades de Tailwind una y otra vez.

## Animación
- Librería: ninguna todavía a nivel de página (`transition-colors` de Tailwind en `Boton`, keyframes escritos a mano en `globals.css` para lo puntual: `fade-in-up` del hero, el acordeón del FAQ, y `overlay-in`/`overlay-out`/`dialog-in`/`dialog-out` de `Dialog`, declaradas en `tailwind.config.ts` en vez del plugin `tailwindcss-animate` para no sumar una dependencia por 2 animaciones).
- **Duraciones y easings estándar:** overlays/diálogos entran en 150ms, salen en 120ms (salir siempre más rápido que entrar). Si se agregan animaciones nuevas, reutilizar esos tiempos en vez de esparcir duraciones ad-hoc.
- **`prefers-reduced-motion`:** sí aplica — todo `animate-*` del proyecto (incluidas las de `Dialog`) cae a `animation-duration: 0.01ms` bajo `@media (prefers-reduced-motion: reduce)` en `globals.css`. Mantener esa lista actualizada si se agrega una animación nueva.

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
- **Inputs numéricos sin spinners.** Regla global en `globals.css` (`input[type="number"]::-webkit-inner-spin-button` etc. + `-moz-appearance: textfield`), no hace falta repetirla por componente. Preferir igual `inputMode="decimal"` sobre texto en vez de `type="number"` cuando el valor lo permite (ver `pesaje/page.tsx`), por consistencia con el teclado numérico móvil sin heredar el resto del comportamiento nativo de `<input type="number">`.
- **Anti-flash de tema:** resuelto — script inline en `src/app/layout.tsx` aplica `.dark` antes del primer paint (ver sección Modo oscuro arriba).
- **NUNCA deshabilitar el zoom del usuario** — ya se respeta (ver Accesibilidad arriba).

## Anti-patrones
- **No** redefinir `roja`/`azul`/`borde`/`panel`/`fondo`/`exito`/`aviso`/`error`/`info` con valores hex sueltos; usar los tokens de `tailwind.config.ts`.
- **No** usar anchos fijos en px para contenedores; usar `w-full` + `max-w-*`.
- **No** usar `//` dentro del JSX (en el `return`); solo `{/* ... */}`.
- **No** escribir un campo de hora editable a mano en el modelo de eventos/peleas: las horas se calculan (`construirAgenda` en `src/lib/horarios.ts`), nunca se escriben directamente — ver `docs/architecture.md` §10.
- **No** hacer que el emparejador (`src/lib/emparejador.ts`) cree peleas directamente: solo propone, el organizador decide.
- **No** confundir el middleware de subdominio con seguridad: la autorización real vive en las políticas RLS de Postgres.
