# Plataforma de torneos de combate

Proyecto Next.js listo para levantar. Arranca sin configurar nada gracias al
modo demo, y se conecta a Supabase cuando pones las variables de entorno.

## Levantar

```bash
npm install
npm run dev
```

Abre http://localhost:3000. Sin variables de entorno funciona con datos de
ejemplo tomados del KICK1 Contender 2026.

Comandos disponibles:

```bash
npm run dev        # desarrollo
npm run build      # compilar para producción
npm run typecheck  # verificar tipos
npm test           # 39 pruebas: emparejador, horarios, nivel y lista de club
```

## Pantallas

| Ruta | Acceso | Para quién |
|---|---|---|
| `/` | público | Landing comercial |
| `/registro` y `/entrar` | público | Crear cuenta y entrar (correo o Google) |
| `/nueva-academia` | con sesión | Onboarding: nombre y slug de la academia |
| `/app` | con sesión | Vista general: lista de eventos y plan |
| `/app/eventos/nuevo` | con sesión | Crear evento |
| `/app/eventos/[id]` | con sesión | Programa, retraso y estado del evento |
| `/app/eventos/[id]/emparejar` | con sesión | Motor de emparejamiento |
| `/app/eventos/[id]/pesaje` | con sesión | Pesaje, funciona sin internet |
| `/app/atletas` | con sesión | Registro compartido y récord histórico |
| `/app/equipo` | con sesión | Invitar mesa de control, coaches y jueces |
| `/app/mi-club` | coach | Cargar lista de alumnos y pagar |
| `/app/pagos` | con sesión | Revisar y aprobar comprobantes |
| `/admin` | staff | Todas las academias de la plataforma |
| `/offline` | público | Pantalla cuando no hay señal ni cache |

Endpoints que devuelven PDF:

| Ruta | Qué genera |
|---|---|
| `/api/eventos/[id]/credenciales?desde=0&cuantos=60` | Credenciales con QR, 8 por hoja A4 |
| `/api/eventos/[id]/acta` | Acta oficial de resultados con firmas |
| `/api/sincronizar` | Recibe la cola offline (POST) |
| `/mesa/[eventoId]` | con sesión | Mesa de control, botones grandes, cola offline |
| `/e/[org]/[evento]` | público | Vista pública del evento |
| `/p/[token]` | público | Link personal del peleador (el del QR) |

En modo demo el panel se abre sin login, con una academia de ejemplo.

## Conectar Supabase

1. Crear el proyecto en Supabase.
2. En el SQL editor, ejecutar en orden los archivos de `supabase/migrations/`.
3. Opcional: `supabase/seed_kick1.sql` carga el evento real de ejemplo
   (47 clubes, 154 peleadores, 78 peleas).
4. Copiar `.env.example` a `.env.local` y llenar las claves.
5. Para Google: en Supabase, Authentication -> Providers -> Google, pegar el
   client ID y secret de Google Cloud, y registrar como URL de retorno
   `https://TU-PROYECTO.supabase.co/auth/v1/callback`.
6. En Authentication -> URL Configuration, agregar `http://localhost:3000/auth/callback`
   y el equivalente de producción.

Antes de exponer nada a producción, verificar el aislamiento entre
organizaciones: crear dos y confirmar que ninguna ve datos de la otra.

## Cómo está organizado

```
src/lib/types.ts        modelo del dominio y cálculo de duración de pelea
src/lib/emparejador.ts  motor de emparejamiento (función pura, con pruebas)
src/lib/horarios.ts     agenda en cascada y cálculo de retraso (con pruebas)
src/lib/datos.ts        datos demo y detección de Supabase
src/lib/supabase/       clientes de navegador y servidor
src/middleware.ts       subdominio de academia -> ruta interna
supabase/migrations/    esquema, RLS, vistas públicas, triggers
tests/                  39 pruebas
```

## Las tres reglas que no hay que romper

**Las horas no se escriben, se calculan.** `construirAgenda` parte de la hora de
inicio de cada área y va sumando duraciones. Cuando una pelea registra su hora
real, todo lo que viene detrás se recorre solo. Si alguna vez aparece un campo
de hora editable a mano, el sistema perdió su razón de ser.

**El subdominio no es seguridad.** El middleware solo resuelve qué organización
se está mirando. Quién puede ver o editar qué lo deciden las políticas RLS en
Postgres.

**El emparejador propone, el organizador decide.** Nunca debe crear peleas
directamente. Sabe de pesos y edades; no sabe que dos peleadores ya se
enfrentaron el mes pasado ni que a un debutante hay que cuidarlo.

## Cómo funciona el modo sin conexión

La mesa de control y el pesaje escriben primero en IndexedDB y después
intentan enviar. `src/lib/offline/db.ts` guarda la cola de operaciones y una
copia de los datos necesarios; `src/lib/offline/sincronizacion.ts` reintenta con
espera creciente hasta 30 segundos y al recuperar la señal.

El indicador muestra cuatro estados: sin conexión, sincronizando, todo
sincronizado y con errores. Si la pestaña se cierra a media jornada, al volver
a abrirla la cola sigue ahí.

Cada operación lleva una clave de idempotencia en la cabecera
`Idempotency-Key`. El endpoint hace upsert por `pelea_id`, así que reenviar la
misma operación no crea un segundo resultado. Esto también cubre el caso de dos
personas de mesa marcando la misma pelea a la vez.

## El registro de atletas es compartido a propósito

La tabla `atleta` cruza todas las academias, identificada por documento. Rompe
el aislamiento del multi-tenant de forma deliberada: si cada academia guardara
su propio historial, alguien con veinte peleas podría inscribirse como
debutante en la academia de al lado y lastimar a un principiante.

El equilibrio está en la vista `v_resumen_atleta`: cualquier academia ve cuántas
peleas tiene y su récord, pero el detalle de cada evento solo lo ve la
organización que lo registró. El nivel se calcula con los cortes de las bases
WAKO, en `src/lib/nivel.ts` y en la función SQL `nivel_por_peleas`, que deben
mantenerse iguales.

## Instalable y arranca sin señal

`public/sw.js` cachea la app para que la mesa y el pesaje abran aunque el
coliseo no tenga internet, incluso si es la primera vez que se abren ese día.

Tres estrategias distintas a propósito: los estáticos de Next van de cache
primero porque su nombre lleva hash y nunca cambian; las páginas van de red
primero con copia de respaldo, para no servir un programa desactualizado; y
`/api/` nunca se cachea, porque un resultado viejo es peor que un error visible.

El service worker solo se registra en producción, así que en desarrollo no
estorba. Faltan los dos iconos PNG en `public/` (192 y 512 px) para que la
instalación en el celular muestre tu marca.

## Pagos

El flujo principal es el comprobante manual: el coach elige Yape, Plin,
transferencia o efectivo, sube la captura y el organizador aprueba. Al aprobar,
un trigger marca como pagadas todas las inscripciones que cubre ese pago.

Para las capturas hay que crear un bucket privado llamado `comprobantes` en
Supabase Storage.

El enganche de pasarela (Culqi o Izipay) todavía no está: el método `tarjeta`
existe en el modelo pero no tiene integración. Cuando lo agregues, entra por el
mismo camino y termina en el mismo estado `aprobado`.

## Lo que falta y cuándo agregarlo

Iconos PWA, integración de pasarela de tarjeta, y notificaciones al peleador
cuando su pelea se acerca.

La cola offline cubre resultados, pesaje y asistencia. La inscripción desde el
panel todavía va directo contra el servidor.
