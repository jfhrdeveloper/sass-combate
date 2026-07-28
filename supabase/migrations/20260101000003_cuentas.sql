create table perfil (
  id         uuid primary key references auth.users(id) on delete cascade,
  nombre     text,
  email      text,
  creado_en  timestamptz not null default now()
);

alter table perfil enable row level security;

create policy perfil_propio on perfil for select using (id = auth.uid());
create policy perfil_edicion on perfil for update using (id = auth.uid());

create or replace function crear_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into perfil (id, nombre, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), new.email)
  on conflict (id) do nothing;
  return new;
end $$;

create trigger tr_crear_perfil
after insert on auth.users
for each row execute function crear_perfil();

create table slug_reservado (slug text primary key);
insert into slug_reservado (slug) values
  ('www'),('app'),('api'),('admin'),('docs'),('blog'),('mail'),('staging'),
  ('soporte'),('ayuda'),('cuenta'),('entrar'),('registro'),('auth'),('e'),('p'),('mesa');

/**
 * Crea una academia y deja al usuario actual como dueño.
 *
 * Va como security definer porque hay un problema de huevo y gallina: las
 * políticas RLS exigen ser miembro de la organización para tocarla, y todavía
 * no existe ninguna membresía.
 */
create or replace function crear_academia(p_nombre text, p_slug text)
returns uuid language plpgsql security definer set search_path = public as $$
declare nueva uuid; limpio text;
begin
  if auth.uid() is null then
    raise exception 'sin sesion';
  end if;

  limpio := lower(regexp_replace(trim(p_slug), '[^a-zA-Z0-9-]', '-', 'g'));
  limpio := regexp_replace(limpio, '-+', '-', 'g');
  limpio := trim(both '-' from limpio);

  if length(limpio) < 3 then
    raise exception 'El identificador debe tener al menos 3 caracteres';
  end if;
  if exists (select 1 from slug_reservado where slug = limpio) then
    raise exception 'Ese identificador está reservado';
  end if;
  if exists (select 1 from organizacion where slug = limpio) then
    raise exception 'Ese identificador ya está en uso';
  end if;

  insert into organizacion (nombre, slug) values (trim(p_nombre), limpio)
  returning id into nueva;

  insert into miembro (organizacion_id, usuario_id, rol)
  values (nueva, auth.uid(), 'dueno');

  return nueva;
end $$;

create or replace function slug_disponible(p_slug text)
returns boolean language sql stable security definer set search_path = public as $$
  select not exists (select 1 from organizacion where slug = lower(p_slug))
     and not exists (select 1 from slug_reservado where slug = lower(p_slug))
$$;

create table invitacion (
  id              uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizacion(id) on delete cascade,
  email           text not null,
  rol             text not null check (rol in ('admin','mesa','juez','lector')),
  token           text not null unique default encode(gen_random_bytes(9), 'base64'),
  aceptada_en     timestamptz,
  creada_por      uuid references auth.users(id),
  creada_en       timestamptz not null default now(),
  unique (organizacion_id, email)
);

alter table invitacion enable row level security;

create policy invitacion_lectura on invitacion for select
  using (organizacion_id in (select mis_organizaciones()));
create policy invitacion_escritura on invitacion for all
  using (puede_editar(organizacion_id))
  with check (puede_editar(organizacion_id));

create or replace function aceptar_invitacion(p_token text)
returns uuid language plpgsql security definer set search_path = public as $$
declare inv invitacion;
begin
  select * into inv from invitacion where token = p_token and aceptada_en is null;
  if not found then
    raise exception 'Invitación no válida o ya usada';
  end if;

  insert into miembro (organizacion_id, usuario_id, rol)
  values (inv.organizacion_id, auth.uid(), inv.rol)
  on conflict (organizacion_id, usuario_id) do update set rol = excluded.rol;

  update invitacion set aceptada_en = now() where id = inv.id;
  return inv.organizacion_id;
end $$;

create or replace view v_mis_academias
with (security_invoker = true) as
select o.id, o.nombre, o.slug, o.plan, m.rol
from organizacion o
join miembro m on m.organizacion_id = o.id
where m.usuario_id = auth.uid();

create table auditoria (
  id              bigserial primary key,
  organizacion_id uuid not null references organizacion(id) on delete cascade,
  tabla           text not null,
  registro_id     uuid not null,
  accion          text not null,
  antes           jsonb,
  despues         jsonb,
  usuario_id      uuid references auth.users(id),
  creado_en       timestamptz not null default now()
);

alter table auditoria enable row level security;
create policy auditoria_lectura on auditoria for select
  using (organizacion_id in (select mis_organizaciones()));

create index auditoria_registro on auditoria (tabla, registro_id, creado_en desc);

create or replace function auditar_resultado()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into auditoria (organizacion_id, tabla, registro_id, accion, antes, despues, usuario_id)
  values (
    coalesce(new.organizacion_id, old.organizacion_id),
    'resultado',
    coalesce(new.pelea_id, old.pelea_id),
    lower(tg_op),
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end,
    auth.uid()
  );
  return coalesce(new, old);
end $$;

create trigger tr_auditar_resultado
after insert or update or delete on resultado
for each row execute function auditar_resultado();
