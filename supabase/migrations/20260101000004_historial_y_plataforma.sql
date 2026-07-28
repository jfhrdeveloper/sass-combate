/**
 * Registro de atletas compartido entre academias.
 *
 * Decisión deliberada: esta tabla rompe el aislamiento por organización, y lo
 * hace por seguridad deportiva. Si cada academia guarda su propio historial,
 * alguien con veinte peleas puede inscribirse como debutante en la academia de
 * al lado y lastimar a un principiante.
 *
 * El aislamiento se conserva donde importa: cualquier academia puede consultar
 * el RESUMEN de un atleta por documento (cuántas peleas, cuántas ganó, cuándo
 * fue la última), pero no los datos personales ni el detalle de los eventos de
 * otras organizaciones. Eso lo controla la vista v_resumen_atleta.
 */
create table atleta (
  id            uuid primary key default gen_random_uuid(),
  documento     text not null unique,
  nombres       text not null,
  apellidos     text not null,
  nacimiento    date,
  sexo          text check (sexo in ('M','F')),
  creado_en     timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

alter table peleador add column atleta_id uuid references atleta(id) on delete set null;
create index peleador_atleta on peleador (atleta_id);

create table historial_pelea (
  id              uuid primary key default gen_random_uuid(),
  atleta_id       uuid not null references atleta(id) on delete cascade,
  organizacion_id uuid references organizacion(id) on delete set null,
  pelea_id        uuid references pelea(id) on delete set null,
  fecha           date not null,
  evento          text not null,
  disciplina      text not null,
  modalidad       text,
  rival           text,
  club_rival      text,
  resultado       text not null check (resultado in ('victoria','derrota','empate','exhibicion','no_disputada')),
  metodo          text,
  peso            numeric(5,2),
  externa         boolean not null default false,
  registrado_por  uuid references auth.users(id),
  creado_en       timestamptz not null default now()
);

create index historial_atleta on historial_pelea (atleta_id, fecha desc);

alter table atleta          enable row level security;
alter table historial_pelea enable row level security;

/** Cualquier usuario con sesión puede consultar el registro de atletas. */
create policy atleta_lectura on atleta for select
  using (auth.uid() is not null);

create policy atleta_escritura on atleta for insert
  with check (auth.uid() is not null);

create policy atleta_actualizacion on atleta for update
  using (exists (select 1 from miembro where usuario_id = auth.uid()));

/** El detalle del historial solo lo ve la organización que lo registró. */
create policy historial_lectura on historial_pelea for select
  using (organizacion_id is null or organizacion_id in (select mis_organizaciones()));

create policy historial_escritura on historial_pelea for all
  using (organizacion_id is null or puede_editar(organizacion_id))
  with check (organizacion_id is null or puede_editar(organizacion_id));

/**
 * Resumen público del atleta: lo que cualquier academia necesita para decidir
 * el nivel, sin exponer de dónde viene cada pelea.
 */
create or replace view v_resumen_atleta
with (security_invoker = false) as
select
  a.id,
  a.documento,
  a.nombres,
  a.apellidos,
  a.nacimiento,
  a.sexo,
  count(h.id) filter (where h.resultado in ('victoria','derrota','empate'))::int as peleas,
  count(h.id) filter (where h.resultado = 'victoria')::int as victorias,
  count(h.id) filter (where h.resultado = 'derrota')::int  as derrotas,
  count(h.id) filter (where h.resultado = 'empate')::int   as empates,
  max(h.fecha) as ultima_pelea,
  array_agg(distinct h.disciplina) filter (where h.disciplina is not null) as disciplinas
from atleta a
left join historial_pelea h on h.atleta_id = a.id
group by a.id;

grant select on v_resumen_atleta to authenticated;

/** Nivel según el número de peleas, con los cortes de las bases WAKO. */
create or replace function nivel_por_peleas(n int)
returns text language sql immutable as $$
  select case
    when n is null or n < 2 then 'debutante'
    when n <= 3  then 'novel_1'
    when n <= 5  then 'novel_2'
    when n <= 11 then 'intermedio'
    when n <= 20 then 'avanzado'
    else 'seleccion'
  end
$$;

/** Al cerrar un resultado, se anota en el historial de ambos atletas. */
create or replace function registrar_en_historial()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  p record; ev record; lado record;
begin
  select * into p from pelea where id = new.pelea_id;
  if p.id is null then return new; end if;

  select nombre, fecha into ev from evento where id = p.evento_id;

  for lado in
    select i.id as inscripcion_id, pe.atleta_id, i.peso_pesaje,
           (case when i.id = new.ganador_id then 'victoria' else 'derrota' end) as res,
           (select (pe2.nombres || ' ' || pe2.apellidos)
              from inscripcion i2 join peleador pe2 on pe2.id = i2.peleador_id
             where i2.id = case when i.id = p.roja_id then p.azul_id else p.roja_id end) as rival,
           m.codigo as modalidad, m.disciplina
      from inscripcion i
      join peleador pe on pe.id = i.peleador_id
      join modalidad m on m.id = i.modalidad_id
     where i.id in (p.roja_id, p.azul_id)
  loop
    if lado.atleta_id is null then continue; end if;

    insert into historial_pelea (
      atleta_id, organizacion_id, pelea_id, fecha, evento, disciplina,
      modalidad, rival, resultado, metodo, peso, registrado_por
    ) values (
      lado.atleta_id, new.organizacion_id, p.id, ev.fecha, ev.nombre, lado.disciplina,
      lado.modalidad, lado.rival,
      case when new.exhibicion then 'exhibicion' else lado.res end,
      new.metodo, lado.peso_pesaje, auth.uid()
    );
  end loop;

  return new;
end $$;

create trigger tr_registrar_en_historial
after insert on resultado
for each row execute function registrar_en_historial();

/**
 * Personal de la plataforma (el equipo del SaaS, no de las academias).
 *
 * Se guarda en su propia tabla para que la condición sea explícita: si algún
 * día hay una fuga, se revisa una sola lista.
 */
create table staff_plataforma (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  rol        text not null default 'soporte' check (rol in ('dueno','soporte')),
  creado_en  timestamptz not null default now()
);

alter table staff_plataforma enable row level security;

create or replace function es_staff()
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from staff_plataforma where usuario_id = auth.uid()) $$;

create policy staff_lectura on staff_plataforma for select using (es_staff());

create policy org_staff on organizacion for select using (es_staff());

create or replace view v_academias_plataforma
with (security_invoker = true) as
select
  o.id, o.nombre, o.slug, o.plan, o.creado_en,
  (select count(*) from miembro m where m.organizacion_id = o.id)::int as miembros,
  (select count(*) from evento e where e.organizacion_id = o.id)::int  as eventos,
  (select count(*) from inscripcion i where i.organizacion_id = o.id)::int as inscripciones,
  (select max(e.fecha) from evento e where e.organizacion_id = o.id) as ultimo_evento
from organizacion o
where es_staff();

grant select on v_academias_plataforma to authenticated;

/** Disciplinas y modalidades de catálogo, disponibles para todas las academias. */
alter table modalidad add column tipo_area text
  check (tipo_area in ('ring','tatami','jaula','cualquiera')) default 'cualquiera';

insert into modalidad (organizacion_id, codigo, nombre, disciplina, tipo_area, config) values
  (null, 'low_kick',       'Low Kick',       'kickboxing', 'ring',   '{"clases":["A","B","C"]}'::jsonb),
  (null, 'k1',             'K1',             'kickboxing', 'ring',   '{"clases":["A","B","C"]}'::jsonb),
  (null, 'full_contact',   'Full Contact',   'kickboxing', 'ring',   '{"clases":["A","B","C"]}'::jsonb),
  (null, 'kick_light',     'Kick Light',     'kickboxing', 'tatami', '{"clases":["A","B","C"]}'::jsonb),
  (null, 'light_contact',  'Light Contact',  'kickboxing', 'tatami', '{"clases":["A","B","C"]}'::jsonb),
  (null, 'point_fighting', 'Point Fighting', 'kickboxing', 'tatami', '{"clases":["A","B","C"]}'::jsonb),
  (null, 'boxeo',          'Boxeo',          'boxeo',      'ring',   '{"rounds":3}'::jsonb),
  (null, 'muay_thai',      'Muay Thai',      'muay thai',  'ring',   '{"rounds":3}'::jsonb),
  (null, 'mma',            'MMA',            'mma',        'jaula',  '{"rounds":3}'::jsonb),
  (null, 'sanda',          'Sanda',          'sanda',      'ring',   '{"rounds":2}'::jsonb),
  (null, 'gi',             'Gi',             'jiu-jitsu',  'tatami', '{"formato":"round_robin"}'::jsonb),
  (null, 'no_gi',          'No Gi',          'jiu-jitsu',  'tatami', '{"formato":"round_robin"}'::jsonb)
on conflict do nothing;

create policy modalidad_catalogo on modalidad for select
  using (organizacion_id is null or organizacion_id in (select mis_organizaciones()));

alter table miembro drop constraint miembro_rol_check;
alter table miembro add constraint miembro_rol_check
  check (rol in ('dueno','admin','mesa','juez','coach','lector'));

alter table invitacion drop constraint invitacion_rol_check;
alter table invitacion add constraint invitacion_rol_check
  check (rol in ('admin','mesa','juez','coach','lector'));

alter table club add column coach_usuario_id uuid references auth.users(id) on delete set null;
