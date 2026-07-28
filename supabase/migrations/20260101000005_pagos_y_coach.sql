/**
 * Cobro de inscripciones.
 *
 * En Perú buena parte de los pagos llega por Yape o Plin con una captura de
 * pantalla, no por pasarela. Por eso el modelo trata el comprobante manual como
 * un caso de primera clase y no como una excepción: el coach sube la imagen y
 * alguien de la academia la aprueba.
 */
create table pago (
  id              uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizacion(id) on delete cascade,
  evento_id       uuid not null references evento(id) on delete cascade,
  club_id         uuid references club(id) on delete set null,
  creado_por      uuid references auth.users(id),
  metodo          text not null check (metodo in ('yape','plin','transferencia','efectivo','tarjeta')),
  monto           numeric(8,2) not null check (monto >= 0),
  moneda          text not null default 'PEN',
  referencia      text,
  comprobante_url text,
  estado          text not null default 'en_revision'
                  check (estado in ('en_revision','aprobado','rechazado')),
  motivo_rechazo  text,
  revisado_por    uuid references auth.users(id),
  revisado_en     timestamptz,
  creado_en       timestamptz not null default now()
);

create table pago_inscripcion (
  pago_id        uuid not null references pago(id) on delete cascade,
  inscripcion_id uuid not null references inscripcion(id) on delete cascade,
  primary key (pago_id, inscripcion_id)
);

create index pago_evento on pago (evento_id, estado);

alter table pago             enable row level security;
alter table pago_inscripcion enable row level security;

create policy pago_lectura on pago for select
  using (organizacion_id in (select mis_organizaciones()));

/** El coach crea su propio pago; solo admin y dueño pueden aprobarlo. */
create policy pago_creacion on pago for insert
  with check (
    organizacion_id in (select mis_organizaciones())
    and estado = 'en_revision'
  );

create policy pago_revision on pago for update
  using (exists (
    select 1 from miembro
     where usuario_id = auth.uid()
       and organizacion_id = pago.organizacion_id
       and rol in ('dueno','admin')
  ));

create policy pago_ins_lectura on pago_inscripcion for select
  using (exists (
    select 1 from pago p
     where p.id = pago_id and p.organizacion_id in (select mis_organizaciones())
  ));

create policy pago_ins_escritura on pago_inscripcion for all
  using (exists (
    select 1 from pago p
     where p.id = pago_id and p.organizacion_id in (select mis_organizaciones())
  ))
  with check (exists (
    select 1 from pago p
     where p.id = pago_id and p.organizacion_id in (select mis_organizaciones())
  ));

/** Al aprobar un pago, las inscripciones que cubre quedan pagadas. */
create or replace function aplicar_pago()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.estado = 'aprobado' and coalesce(old.estado, '') <> 'aprobado' then
    update inscripcion
       set estado = 'pagada'
     where id in (select inscripcion_id from pago_inscripcion where pago_id = new.id)
       and estado = 'pendiente';
  end if;
  return new;
end $$;

create trigger tr_aplicar_pago
after update of estado on pago
for each row execute function aplicar_pago();

/** Precio vigente según la fecha de cierre del evento. */
create or replace function precio_inscripcion(p_evento_id uuid)
returns numeric language sql stable as $$
  select case
    when e.cierre_inscripcion is null then coalesce(e.precio_normal, 0)
    when now() <= e.cierre_inscripcion then coalesce(e.precio_normal, 0)
    else coalesce(e.precio_extemporaneo, e.precio_normal, 0)
  end
  from evento e where e.id = p_evento_id
$$;

/**
 * Un coach solo debe ver y tocar los peleadores de su propio club.
 * Las políticas anteriores le daban acceso a toda la organización, así que aquí
 * se restringen para ese rol.
 */
create or replace function mis_clubes()
returns setof uuid
language sql stable security definer set search_path = public
as $$ select id from club where coach_usuario_id = auth.uid() $$;

create or replace function es_coach(org uuid)
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from miembro
   where usuario_id = auth.uid() and organizacion_id = org and rol = 'coach'
) $$;

drop policy peleador_escritura on peleador;
create policy peleador_escritura on peleador for all
  using (
    case when es_coach(organizacion_id)
         then club_id in (select mis_clubes())
         else puede_editar(organizacion_id) end
  )
  with check (
    case when es_coach(organizacion_id)
         then club_id in (select mis_clubes())
         else puede_editar(organizacion_id) end
  );

drop policy inscripcion_escritura on inscripcion;
create policy inscripcion_escritura on inscripcion for all
  using (
    case when es_coach(organizacion_id)
         then peleador_id in (select id from peleador where club_id in (select mis_clubes()))
         else puede_editar(organizacion_id) end
  )
  with check (
    case when es_coach(organizacion_id)
         then peleador_id in (select id from peleador where club_id in (select mis_clubes()))
         else puede_editar(organizacion_id) end
  );

/** Añade 'mesa' a puede_editar solo para las tablas donde corresponde. */
create or replace view v_mi_club
with (security_invoker = true) as
select c.id, c.nombre, c.organizacion_id,
       (select count(*) from peleador p where p.club_id = c.id)::int as peleadores
from club c
where c.coach_usuario_id = auth.uid();

grant select on v_mi_club to authenticated;
