# sass-combate

Plataforma SaaS multi-tenant para gestionar torneos de deportes de contacto:
eventos, emparejamiento, pesaje, mesa de control offline, pagos y documentos
(credenciales con QR, actas).

```bash
npm install
npm run dev        # http://localhost:3000, corre en modo demo sin Supabase
npm run typecheck
npm test           # pruebas del emparejador, horarios, nivel y lista de club
npm run lint
```

## Documentos relacionados

- **`docs/style-guide.md`** — Estilo visual, tipografía, paleta, componentes, animación, accesibilidad y convenciones de código.
- **`docs/architecture.md`** — Cómo está construido el sistema: stack, capa de datos, rutas, auth, integraciones e invariantes.
- **`docs/pending-task.md`** — Roadmap, bitácora de sesiones y trabajo pendiente.
- **`docs/db-notes.md`** — Índice del schema de Supabase (el SQL real vive en `supabase/migrations/`).

## Las tres reglas que no hay que romper

1. **Las horas no se escriben, se calculan** (`src/lib/horarios.ts`).
2. **El subdominio no es seguridad**; la autorización real es RLS en Postgres.
3. **El emparejador propone, el organizador decide** (`src/lib/emparejador.ts`).

Detalle completo de estas y otras invariantes en `docs/architecture.md` §10.
