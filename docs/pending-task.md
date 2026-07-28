# Tareas pendientes y bitácora

> Control de estado, decisiones y trabajo pendiente. Una entrada por sesión de trabajo.
> Fechas en formato ISO año-mes-día (`YYYY-MM-DD`).

## Roadmap
- [ ] Integrar pasarela de pago con tarjeta (Culqi o Izipay) — el método `tarjeta` existe en el modelo de datos pero no tiene proveedor conectado.
- [ ] Notificaciones al peleador cuando su pelea se acerca (canal por definir: email, SMS, push web).
- [ ] Reemplazar los iconos PWA placeholder por el arte de marca real (192px y 512px).
- [ ] Conectar el proyecto a Supabase real y verificar aislamiento entre organizaciones (crear dos academias de prueba y confirmar que ninguna ve datos de la otra) antes de exponer a producción.
- [ ] Desplegar a Vercel (o el hosting elegido) y configurar dominio con soporte de subdominios por academia.

## Pendientes activos
- [ ] Extender la inscripción desde el panel para pasar por la cola offline (hoy va directo contra el servidor; solo resultados, pesaje y asistencia usan la cola).
- [ ] Formalizar tokens de color para estados (éxito/aviso/error/info) en `tailwind.config.ts` — hoy se usan utilidades sueltas.

## Bitácora de sesiones

### 2026-07-28 — Inicialización de documentación y estandarización del proyecto
- **Qué cambió:**
  - Se generó la estructura `docs/` (`style-guide.md`, `architecture.md`, `pending-task.md`, `db-notes.md`) con `plantillabase-docs`, y `CLAUDE.md` enlazando a esos documentos.
  - Se instalaron las dependencias (`npm install`), no existía `node_modules` ni lockfile.
  - Se inicializó el repositorio git (no existía `.git`) con un primer commit.
  - Se eliminó una carpeta vacía `{src/{app,lib,components}` (residuo de un `mkdir` con expansión de llaves fallida en PowerShell).
  - Se configuró ESLint (`eslint-config-next`) para que `npm run lint` funcione.
  - Se generaron iconos PWA placeholder (`public/icono-192.png`, `public/icono-512.png`) para que el manifest deje de apuntar a archivos inexistentes; son marcadores de posición, no arte de marca final.
- **Por qué:** estandarizar la documentación y dejar el entorno de desarrollo funcional de punta a punta (clonar → instalar → correr).
- **Pendiente:** rellenar la paleta/tipografía real cuando haya diseño de marca definitivo; conectar Supabase real; decidir proveedor de pago con tarjeta y canal de notificaciones (ver Roadmap).
