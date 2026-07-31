/**
 * Historial de compras de plan (Academia o desbloqueo por evento).
 *
 * Hasta ahora cada compra solo sobrescribía `organizacion.plan_vence_en` o
 * `evento.plan_vence_en` — no quedaba ninguna fila de lo pagado. Esta tabla
 * es de solo lectura desde la aplicación (además de la inserción que hacen
 * las rutas de cobro): no tiene trigger que actualice nada, es un registro,
 * no la fuente de verdad del vencimiento vigente (esa sigue siendo
 * `plan_vence_en` en `organizacion`/`evento`, ver src/lib/planes.ts).
 */
create table compra_plan (
  id              uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizacion(id) on delete cascade,
  evento_id       uuid references evento(id) on delete set null,
  tipo            text not null check (tipo in ('academia_mes', 'academia_anio', 'evento')),
  monto           numeric(8,2) not null check (monto >= 0),
  moneda          text not null default 'PEN',
  cargo_id        text,
  vence_en        timestamptz not null,
  creado_por      uuid references auth.users(id),
  creado_en       timestamptz not null default now()
);

create index compra_plan_organizacion on compra_plan (organizacion_id, creado_en desc);

alter table compra_plan enable row level security;

create policy compra_plan_lectura on compra_plan for select
  using (organizacion_id in (select mis_organizaciones()));

/** Mismo criterio que evento_escritura/org_edicion: dueño, admin o mesa. */
create policy compra_plan_creacion on compra_plan for insert
  with check (puede_editar(organizacion_id));
