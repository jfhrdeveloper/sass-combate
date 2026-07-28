# Notas de base de datos

> El schema real y ejecutable vive en `supabase/migrations/` — este archivo NO lo duplica,
> solo indexa qué contiene cada migración para orientarse rápido. Cualquier cambio de
> modelo de datos se hace en `supabase/migrations/`, nunca aquí.

## Orden de ejecución

Correr en el SQL Editor de Supabase, en este orden exacto:

| Archivo | Contenido |
|---|---|
| `supabase/migrations/20260101000001_esquema.sql` | Esquema base: `organizacion`, `miembro`, `club`, `peleador`, `modalidad`, `evento`, `area`, `area_modalidad`, `categoria`, `inscripcion`, `llave`, `pelea`, `resultado`, `bloque`. |
| `supabase/migrations/20260101000002_rls_y_funciones.sql` | Políticas RLS y funciones — **aquí vive la autorización real** (ver `docs/architecture.md` §4). |
| `supabase/migrations/20260101000003_cuentas.sql` | `perfil`, `slug_reservado`, `invitacion`, `auditoria`. |
| `supabase/migrations/20260101000004_historial_y_plataforma.sql` | `atleta` (registro compartido entre academias), `historial_pelea`, `staff_plataforma`. |
| `supabase/migrations/20260101000005_pagos_y_coach.sql` | `pago`, `pago_inscripcion`. |

Opcional, después de las migraciones: `supabase/seed_kick1.sql` carga el evento real de ejemplo (47 clubes, 154 peleadores, 78 peleas — el torneo KICK1 Contender 2026).

## Storage

Falta crear a mano en Supabase Storage: un bucket **privado** llamado `comprobantes` (capturas de pago). No se crea por migración SQL.

## Invariantes de datos a no romper

Ver `docs/architecture.md` §10 para el detalle completo. Resumen:
- `nivel_por_peleas` (función SQL) debe mantenerse igual a `src/lib/nivel.ts`.
- `atleta` cruza organizaciones a propósito; el detalle de cada evento no.
- `pelea.duracion_est_seg` es una columna generada (`generated always as`) — nunca se escribe a mano, se calcula a partir de rounds/duración/descanso.
