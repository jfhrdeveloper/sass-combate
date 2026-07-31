/**
 * Aviso al peleador cuando su pelea se acerca (email, SMS, WhatsApp, push web).
 *
 * El disparo ocurre en el servidor (`avisarPeleasCercanas`, en
 * src/lib/notificaciones/) justo después de recalcular_horarios: ahí es
 * cuando una hora estimada puede haber cruzado el umbral de aviso. No hay
 * cron: el flujo de la mesa registrando resultados todo el día ya recalcula
 * horarios con frecuencia suficiente.
 */
alter table peleador add column telefono text;
alter table peleador add column email text;

create table push_suscripcion (
  id              uuid primary key default gen_random_uuid(),
  inscripcion_id  uuid not null references inscripcion(id) on delete cascade,
  endpoint        text not null,
  p256dh          text not null,
  auth            text not null,
  creado_en       timestamptz not null default now(),
  unique (inscripcion_id, endpoint)
);

/** Evita reenviar el mismo aviso en cada recálculo de horarios. */
create table notificacion_enviada (
  id              uuid primary key default gen_random_uuid(),
  inscripcion_id  uuid not null references inscripcion(id) on delete cascade,
  canal           text not null check (canal in ('email','sms','whatsapp','push')),
  tipo            text not null default 'pelea_cerca',
  enviado_en      timestamptz not null default now(),
  unique (inscripcion_id, canal, tipo)
);

alter table push_suscripcion    enable row level security;
alter table notificacion_enviada enable row level security;

/**
 * El peleador se suscribe desde /p/[token] sin sesión (igual que ya puede ver
 * su hora de pelea ahí sin login): la escritura de la suscripción y del
 * registro de aviso enviado las hace únicamente el servidor con
 * `service_role` (ver src/lib/supabase/admin.ts), nunca a pedido directo del
 * cliente. Por eso no hay política de insert para ningún rol: RLS deniega por
 * defecto y solo `service_role`, que ignora RLS, puede escribir.
 */
create policy push_suscripcion_lectura on push_suscripcion for select
  using (
    inscripcion_id in (
      select id from inscripcion where organizacion_id in (select mis_organizaciones())
    )
  );

create policy notificacion_lectura on notificacion_enviada for select
  using (
    inscripcion_id in (
      select id from inscripcion where organizacion_id in (select mis_organizaciones())
    )
  );
