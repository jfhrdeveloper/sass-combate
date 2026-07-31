/**
 * Libro de Reclamaciones Virtual (D.S. N.º 011-2011-PCM, Ley N.º 29571):
 * obligatorio para cualquier proveedor de bienes o servicios en Perú, y debe
 * vivir dentro de la propia web/app, no depender de un formulario externo
 * (Google Forms, Drive, etc.).
 *
 * Es del proveedor de la plataforma (sass-combate), no de cada academia: una
 * academia organizando su propio evento es a su vez proveedora ante sus
 * propios inscritos, y necesitaría su propio libro — eso queda fuera de esta
 * migración, es un problema aparte si se decide ofrecerlo como feature.
 */
create table reclamo (
  id                  uuid primary key default gen_random_uuid(),
  numero              int not null,
  tipo                text not null check (tipo in ('reclamo', 'queja')),
  consumidor_nombre   text not null,
  documento_tipo      text not null check (documento_tipo in ('dni', 'ce', 'pasaporte')),
  documento_numero    text not null,
  consumidor_domicilio text not null,
  consumidor_telefono text,
  consumidor_correo   text not null,
  es_menor_edad       boolean not null default false,
  tutor_nombre        text,
  bien_o_servicio     text not null,
  monto_reclamado     numeric(10,2),
  detalle             text not null,
  pedido              text not null,
  estado              text not null default 'pendiente' check (estado in ('pendiente', 'respondido')),
  respuesta           text,
  respondido_por      uuid references auth.users(id),
  respondido_en       timestamptz,
  creado_en           timestamptz not null default now()
);

/** Correlativo legible (RC-2026-000123) sin depender de una secuencia aparte. */
create sequence reclamo_numero_seq;
alter table reclamo alter column numero set default nextval('reclamo_numero_seq');

alter table reclamo enable row level security;

/** Cualquiera puede presentar un reclamo, con o sin sesión — es un derecho del consumidor. */
create policy reclamo_creacion on reclamo for insert
  with check (true);

/** Solo el equipo de la plataforma puede leer y responder — contiene datos personales del reclamante. */
create policy reclamo_lectura on reclamo for select using (es_staff());
create policy reclamo_respuesta on reclamo for update using (es_staff()) with check (es_staff());

/**
 * Vigencia de un plan pagado una sola vez (sin cobro recurrente todavía):
 * quien vende el plan sabe hasta cuándo vale sin necesitar una tabla de
 * suscripciones. Null = plan gratis, sin vencimiento.
 */
alter table organizacion add column plan_vence_en timestamptz;

/** v_mis_academias (20260101000003) gana plan_vence_en para /app/plan. */
create or replace view v_mis_academias
with (security_invoker = true) as
select o.id, o.nombre, o.slug, o.plan, m.rol, o.plan_vence_en
from organizacion o
join miembro m on m.organizacion_id = o.id
where m.usuario_id = auth.uid();
