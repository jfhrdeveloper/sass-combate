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
| `supabase/migrations/20260101000006_notificaciones.sql` | `telefono`/`email` en `peleador`, `push_suscripcion`, `notificacion_enviada` (aviso al peleador). |
| `supabase/migrations/20260101000007_vistas_publicas_evento.sql` | `v_publico_evento`, `v_publico_area`, `v_publico_bloque` (abiertas a `anon`, filtradas por `evento.publico`) + columnas nuevas en `v_publico_pelea` (`area_id`, `roja_id`, `azul_id`, `hora_inicio_real`, `hora_fin_real`) para que `/e/[org]/[evento]` pueda leer datos reales con `construirAgenda()`. |
| `supabase/migrations/20260101000008_vincular_pago_inscripcion.sql` | Función `vincular_pago_inscripciones` — enlaza las inscripciones pendientes de un club en `pago_inscripcion` al crear un pago, para que `tr_aplicar_pago` las marque pagadas al aprobarse. |
| `supabase/migrations/20260101000009_libro_reclamaciones.sql` | Tabla `reclamo` (Libro de Reclamaciones Virtual, campos según la hoja oficial de INDECOPI incluido `consumidor_domicilio`; RLS: insert público, select/update solo `es_staff()`) + `organizacion.plan_vence_en` + `v_mis_academias` actualizada con esa columna. |
| `supabase/migrations/20260101000010_plan_por_evento.sql` | `evento.plan_vence_en` — desbloqueo del plan "Por evento" ahora es por evento puntual (comprado desde `/api/pagos/evento`), no organización completa. El plan Academia sigue siendo por organización. |
| `supabase/migrations/20260101000014_descuento_pago.sql` | `pago.descuento_tipo`/`descuento_valor` (monto fijo o porcentaje, puntual por pago) + `pago.monto_final` (columna generada, el descuento ya aplicado). Se agrega al aprobar el pago (dueño/admin), no al registrarlo. |
| `supabase/migrations/20260101000015_auditoria_con_nombre.sql` | Política `perfil_companeros` (lee el perfil de cualquiera que comparta organización vía `miembro`, además de `perfil_propio`) + vista `v_auditoria` (join explícito `auditoria`+`perfil`, `security_invoker`) para que `/app/auditoria` muestre el nombre de quien hizo el cambio en vez del UUID crudo. |
| `supabase/migrations/20260101000016_equipo_gestion.sql` | Política `miembro_eliminacion` (solo dueño/admin de la misma organización) — `miembro` no tenía ninguna política de escritura fuera de las funciones `security definer` que la insertan. Vista `v_equipo` (join explícito `miembro`+`perfil`, mismo motivo que `v_auditoria`) para que `/app/equipo` liste a quién ya es miembro, no solo el formulario de invitar. |
| `supabase/migrations/20260101000017_indices_evento.sql` | Índices en `pelea.evento_id`, `area.evento_id`, `bloque.evento_id`, `categoria.evento_id` — Postgres no indexa foreign keys solo; esas columnas se filtran seguido (agenda pública, panel del evento) y el costo crece con el volumen total de la plataforma, no solo del evento. |
| `supabase/migrations/20260101000018_peleador_por_academia.sql` | Vista `v_mi_peleador` (récord/nivel calculados solo con el historial de tu organización) + función `peleas_otras_academias()` (cuenta cruzada bajo demanda, sin exponer detalle). Reemplaza el uso de `v_resumen_atleta` en la app — cada academia deja de ver el conteo combinado de todas. |

Opcional, después de las migraciones: `supabase/seed_kick1.sql` carga el evento real de ejemplo (47 clubes, 154 peleadores, 78 peleas — el torneo KICK1 Contender 2026).

## Storage

Falta crear a mano en Supabase Storage: un bucket **privado** llamado `comprobantes` (capturas de pago). No se crea por migración SQL. El bucket no tiene ninguna política de Storage propia (ni de lectura ni de escritura vía RLS de `storage.objects`): `registrarPago` sube el archivo bajo la sesión normal del coach (el insert en `pago` ya está protegido por su propia RLS), y `listarPagos()` (`src/services/pagos.ts`) genera una URL firmada con `service_role` para que dueño/admin pueda ver la imagen al revisar — no hace falta una política de Storage porque la fila de `pago` ya pasó por RLS antes de decidir qué comprobante firmar.

## Invariantes de datos a no romper

Ver `docs/architecture.md` §10 para el detalle completo. Resumen:
- `nivel_por_peleas` (función SQL) debe mantenerse igual a `src/lib/nivel.ts`.
- **Cada academia tiene su propio registro de peleadores, sin compartir con otras** (decisión del 2026-08-06, revirtió el diseño original de "registro compartido"). `atleta`/`atleta_id` siguen existiendo como enlace interno (solo para el trigger `registrar_en_historial()` y `peleas_otras_academias()`), nunca se editan ni se muestran directo — `editarPeleador`/`eliminarPeleador` (`src/actions/atletas.ts`) tocan la fila de `peleador`, que ya tenía RLS completa por organización (`peleador_lectura`/`peleador_escritura`, esquema base) — no hizo falta ninguna política nueva. `v_resumen_atleta` (el diseño anterior) se dejó en el schema sin usar. Ver `v_mi_peleador` y `peleas_otras_academias()` en `20260101000018_peleador_por_academia.sql`.
- `pelea.duracion_est_seg` es una columna generada (`generated always as`) — nunca se escribe a mano, se calcula a partir de rounds/duración/descanso.
- `push_suscripcion` y `notificacion_enviada` no tienen política de insert: a propósito, para que solo `service_role` (nunca RLS de sesión) pueda escribir ahí — ver `src/lib/supabase/admin.ts`.
