# Guía de estilo

> Fuente única de verdad para estilo visual y convenciones de código. No duplicar en CLAUDE.md.

## Tipografía
- Familia única (`next/font/google` en `src/app/layout.tsx`, expuesta como `--font-display`/`--font-body` y `font-display`/`font-body` en Tailwind, mismo esquema de dos roles de antes, ahora la misma tipografía en ambos):
  - **Poppins** (`font-display`, grosores 500/600/700) — títulos (`h1`/`h2`/`h3`, regla global en `globals.css`), botones (`Boton`), números de marcador (`TarjetaDato`, `TarjetaPelea`, horas), insignias de estado (`Insignia`).
  - **Poppins** (`font-body`, grosores 400/500/600) — texto de párrafo, tablas de datos, formularios. Es el `body` por defecto (`globals.css`).
  - Poppins no es una fuente variable en Google Fonts (a diferencia de Inter, que se usaba antes): cada grosor se carga como un archivo estático aparte, por eso `layout.tsx` solo pide los grosores que el proyecto realmente usa (`font-normal`/`font-medium`/`font-semibold`, sin `font-bold` ni más pesado en ningún lado hoy).
  - **Regla:** no mezclar tipografías fuera de este esquema; si un elemento es un título, un botón, un número destacado o una insignia de estado, usa `font-display` (ya viene incluido en `Boton`/`TarjetaDato`/`Insignia`/`h1`-`h3`); todo lo demás hereda `font-body` del `body`. La jerarquía entre título y cuerpo la marca el grosor (`font-display` empieza en 500, `font-body` en 400), no dos tipografías distintas.
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
- **Grids de tarjetas: nunca saltar de 1 a más de 2 columnas en el primer breakpoint.** Un grid de 4 tarjetas-estadística en mobile (< 640px) va en `grid-cols-2` como base, no en 1 columna directo a `sm:grid-cols-4`. Patrón de referencia: `grid grid-cols-2 gap-3 sm:grid-cols-4` (ver `admin/page.tsx`, `atletas/[id]/page.tsx`, `emparejar/page.tsx`, `eventos/[id]/page.tsx`, y `mesa/[eventoId]/page.tsx` que ya lo hacía bien con 3 columnas).
- **Tablas anchas: `overflow-x-auto` en el wrapper, nunca `overflow-hidden`.** `overflow-hidden` solo se usaba para recortar las esquinas de la tabla al `rounded-xl` del contenedor, pero como efecto secundario también recorta contenido en mobile sin dar forma de verlo. Envolver la tabla en `overflow-x-auto` (el scroll queda contenido ahí, nunca en el body de la página) y darle a la `<table>` un `min-w-[...]` explícito para que las columnas no se aplasten ilegibles en vez de generar el scroll.

## Componentes UI
Los componentes base viven en `src/components/ui/` (`badge.tsx`, `button.tsx`, `card.tsx`, `formulario.tsx`, `input.tsx`, `tarjeta-pelea.tsx`), construidos con `class-variance-authority` (`cva`) + `cn` (`clsx` + `tailwind-merge`, en `src/lib/utils.ts`).

- **Botones (`Boton`, en `button.tsx`):**
  - Variantes: `solido` (default), `contorno`, `roja`, `azul`, `fantasma`.
  - Tamaños: `sm`, `md` (default), `lg`, `mesa` (pantallas de mesa de control, ver arriba; además va en mayúsculas).
  - Envuelto en `forwardRef`: lo necesita Radix (`asChild` en `DialogTrigger`, y cualquier otro trigger de Radix que se agregue) para adjuntar su ref al `<button>` real sin anidarlo dentro de otro elemento interactivo. Cualquier componente nuevo de `ui/` que se use como trigger de Radix con `asChild` necesita el mismo tratamiento.
- **`TarjetaPelea` (`tarjeta-pelea.tsx`):** la firma visual de la plataforma — el enfrentamiento roja/azul, con roja alineada a la derecha y azul a la izquierda mirándose (como un cartel de pelea real), separadas por una marca "vs". Tamaños `sm`/`md`/`lg`. Se usa en mesa de control, emparejamiento, el evento público y la credencial personal — siempre que se muestre un cruce, usar este componente en vez de armar el layout a mano. **Cuidado con `lg` en contenedores angostos** (menos de ~400px): con nombres largos trunca; en esos casos usar `md`.
- **Insignias de estado (`Insignia`, en `badge.tsx`):** `font-display`, mayúsculas, `tracking-wide`, siempre `px-2 py-0.5` (mismo padding en todo uso; nunca armar un chip de estado a mano con otro padding, ver la corrección de `mi-club`/`pagos` en la bitácora de 2026-08-06). Cubre `pelea.estado`/`evento.estado`, el resultado de una pelea en el historial de un atleta (`victoria`/`derrota`/`empate`/`exhibicion`/`no_disputada`), el estado de un pago (`en_revision`/`aprobado`/`rechazado`) y el de una inscripción vista desde Mi Club (`por_pagar`/`pagado`). **No** todo chip de color es un estado: el nivel de un atleta, un puntaje de emparejamiento o una acción de auditoría (`Creado`/`Modificado`/`Eliminado`, vocabulario propio, ver comentario en `auditoria/page.tsx`) tienen su propio significado y no deben forzarse dentro de `Insignia`.
- **Formularios e inputs:** `react-hook-form` + `@hookform/resolvers` + `zod` para validación; componentes en `formulario.tsx` e `input.tsx`.
- **Casillas desplegables (`Select`, en `select.tsx`):** envoltorio propio sobre `@radix-ui/react-select` (no shadcn/ui completo, solo el primitivo, con los tokens de color del proyecto en vez del theme por defecto de shadcn). **Regla:** nunca un `<select>` nativo del navegador — la flecha de un `<select>` nativo queda pegada al borde derecho; `SelectTrigger` siempre reserva espacio propio (`pr-9` + ícono en `right-3`, nunca `right-0`). Participa en formularios nativos vía su prop `name` (Radix genera un `<select>` oculto para el `FormData`); si el valor "vacío"/"cualquiera" es una opción real (no un placeholder), usar un valor centinela no vacío (ej. `"todos"`) y traducirlo a `undefined` en el server action — Radix no permite `value=""` en un `SelectItem`.
- **Modales / overlays (`Dialog`, en `dialog.tsx`):** mismo criterio que `Select`, envoltorio propio sobre `@radix-ui/react-dialog`. Usar para formularios cortos (editar algo puntual), no para formularios largos (ahí una sección expandible o una página aparte sigue siendo mejor).
- **Confirmación de acciones destructivas (`AlertDialog`, en `alert-dialog.tsx`):** sobre `@radix-ui/react-alert-dialog`, no `Dialog`. La diferencia real: `AlertDialog` no se cierra clickeando afuera ni con Escape sin elegir una opción explícita (Cancelar/confirmar) — justo lo que hace falta antes de borrar algo. Ver `categorias-evento.tsx` (eliminar categoría) y `equipo/miembros.tsx` (quitar miembro) para el patrón: `AlertDialogTrigger`/`AlertDialogCancel`/`AlertDialogAction` con `asChild` envolviendo `Boton`, mismo formulario async con `setAbierto(false)` al terminar que ya usa `Dialog`.
- **Tablas / listas:** `@tanstack/react-table` está instalado pero todavía no se usa en ningún componente — hoy las listas son `.map()` simple. Cualquier lista pagina con `paginar()` (`src/lib/paginacion.ts`) + `<Paginador>` (`src/components/ui/paginador.tsx`, Server Component sin JS de cliente: navega por `?page=`). **Tamaño de página: 8 en escritorio, 4 en mobile** (`TAMANO_PAGINA`/`TAMANO_PAGINA_MOVIL`), decidido por `tamanoPaginaActual()` leyendo la cookie `ancho_pantalla` que deja `<DetectorAncho>` (montado una vez en `AppShell` y en `admin/layout.tsx`, sin salida visual: solo detecta el breakpoint `sm` de Tailwind con `matchMedia` y refresca si cambió). Sin la cookie (primera visita) cae a 8, para no regresionar esa carga inicial. Páginas server-side que ya lo usan: `atletas/page.tsx`, `pagos/page.tsx`, `mi-club/page.tsx`, `admin/reclamos/page.tsx`, `app/page.tsx`, `admin/page.tsx`, y `eventos/[id]/page.tsx` (cada área pagina su propia tabla con su propio query param `area-<id>`, para no pisar la página de las demás áreas de la misma pantalla). **Excepción:** `emparejar/page.tsx` es 100% Client Component (drag-and-drop), así que su lista "sin rival" pagina con estado de React + `matchMedia` directo en vez de la cookie/servidor — mismos tamaños (4/8), mecanismo distinto porque no hay Server Component de por medio. Los contadores de tarjetas/resúmenes siempre se calculan sobre la lista completa, nunca sobre la página visible.
- **Clases globales reutilizables:** centralizar en `globals.css` cualquier patrón que se repita en 3+ componentes; no redeclarar las mismas utilidades de Tailwind una y otra vez.

## Animación
- **Librería: `framer-motion`**, agregada en la auditoría de interfaz del 2026-08-06. Antes solo había `transition-colors` de Tailwind y keyframes escritos a mano en `globals.css` (`fade-in-up` del hero, el acordeón del FAQ, `overlay-in`/`overlay-out`/`dialog-in`/`dialog-out` de `Dialog`, esos siguen igual, no se migraron). `Boton` (`button.tsx`) es ahora `motion.button`: todo botón del proyecto tiene `whileTap`/`whileHover` de fábrica (no hace falta agregarlo por pantalla), salvo tamaños `lg`/`mesa` (pensados para dedo/guante, sin `whileHover`) o cuando el botón está `disabled`.
- **`estilos()` vive aparte de `Boton`** (`src/components/ui/estilos-boton.ts`, sin `"use client"`): varias Server Components llaman esa función CVA directo para estilizar un `<Link>` como botón sin anidar un `<button>` real. `Boton` sí necesita `"use client"` (usa `motion.button`), así que llamar `estilos()` importándolo desde `button.tsx` revienta el build ("Attempted to call estilos() from the server"). Cualquier helper puramente de clases que hoy viva en un componente de `ui/` marcado `"use client"` y que alguna Server Component necesite llamar como función (no renderizar como JSX) necesita el mismo tratamiento: separarlo a su propio módulo sin la directiva.
- **`MotionConfig reducedMotion="user"`** en `src/app/providers.tsx`, una sola vez: respeta `prefers-reduced-motion` para toda animación de framer-motion del proyecto sin repetir el chequeo componente por componente.
- **Duraciones y easings estándar:** micro-interacciones de botón, 120ms. Overlays/diálogos entran en 150ms, salen en 120ms (salir siempre más rápido que entrar). Si se agregan animaciones nuevas, reutilizar esos tiempos en vez de esparcir duraciones ad-hoc.
- **`prefers-reduced-motion`:** cubierto en dos capas — `MotionConfig` para framer-motion, y `@media (prefers-reduced-motion: reduce)` en `globals.css` para los `animate-*` de Tailwind (`fade-in-up`, `overlay-*`, `dialog-*`). Mantener esa segunda lista actualizada si se agrega una animación CSS nueva (las de framer-motion no necesitan tocarla).
- **Skeleton loading (`boneyard-js`): instalado, sin usar todavía.** Decisión del usuario: pilotear primero antes de adoptarlo en todo el proyecto. Hallazgo del piloto (2026-08-06): el paquete depende de `playwright`, pero solo lo usa el CLI (`npx boneyard-js build`, un paso de desarrollo que visita la app en un navegador headless y captura la posición real de cada `<Skeleton name="...">` para generar un registro estático) — el componente `<Skeleton>` en tiempo de ejecución (`boneyard-js/react`) no importa `playwright` en ningún lado, así que no engorda ningún bundle de producción (confirmado: el tamaño de cada ruta en `npm run build` no cambió tras instalar el paquete). `boneyard.config.json` ya apunta a `/app/eventos/[id]/pesaje` como la pantalla piloto. **No se completó la captura real** (`npm run skeletons`) porque necesita un navegador de verdad para medir el layout, y esta sesión no tiene forma de controlar uno interactivamente — es un paso que hay que correr una vez, localmente, con `npm run dev` levantado. Hasta que alguien lo corra, `<Skeleton>` no está usado en ningún componente todavía (evitar cablear un uso que dependa de un registro que no existe).

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
