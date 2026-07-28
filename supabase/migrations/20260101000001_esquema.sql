create extension if not exists pgcrypto;

create table organizacion (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  slug          text not null unique,
  plan          text not null default 'free',
  creado_en     timestamptz not null default now()
);

create table miembro (
  id              uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizacion(id) on delete cascade,
  usuario_id      uuid not null references auth.users(id) on delete cascade,
  rol             text not null check (rol in ('dueno','admin','mesa','juez','lector')),
  creado_en       timestamptz not null default now(),
  unique (organizacion_id, usuario_id)
);

create table club (
  id              uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizacion(id) on delete cascade,
  nombre          text not null,
  nombre_norm     text generated always as (lower(regexp_replace(nombre, '[^a-zA-Z0-9]', '', 'g'))) stored,
  ciudad          text,
  creado_en       timestamptz not null default now(),
  unique (organizacion_id, nombre_norm)
);

create table peleador (
  id              uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizacion(id) on delete cascade,
  club_id         uuid references club(id) on delete set null,
  nombres         text not null,
  apellidos       text not null,
  documento       text,
  nacimiento      date,
  sexo            text check (sexo in ('M','F')),
  foto_url        text,
  creado_en       timestamptz not null default now(),
  unique (organizacion_id, documento)
);

create table modalidad (
  id              uuid primary key default gen_random_uuid(),
  organizacion_id uuid references organizacion(id) on delete cascade,
  codigo          text not null,
  nombre          text not null,
  disciplina      text not null,
  config          jsonb not null default '{}'::jsonb,
  unique (organizacion_id, codigo)
);

create table evento (
  id                uuid primary key default gen_random_uuid(),
  organizacion_id   uuid not null references organizacion(id) on delete cascade,
  nombre            text not null,
  slug              text not null,
  fecha             date not null,
  sede              text,
  zona_horaria      text not null default 'America/Lima',
  publico           boolean not null default false,
  fecha_pesaje      timestamptz,
  cierre_inscripcion timestamptz,
  precio_normal     numeric(8,2),
  precio_extemporaneo numeric(8,2),
  estado            text not null default 'borrador'
                    check (estado in ('borrador','inscripciones','pesaje','programado','en_curso','finalizado')),
  creado_en         timestamptz not null default now(),
  unique (organizacion_id, slug)
);

create table area (
  id              uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizacion(id) on delete cascade,
  evento_id       uuid not null references evento(id) on delete cascade,
  nombre          text not null,
  tipo            text not null check (tipo in ('ring','tatami','jaula')),
  hora_inicio     timestamptz not null,
  orden           int not null default 1
);

create table area_modalidad (
  area_id      uuid not null references area(id) on delete cascade,
  modalidad_id uuid not null references modalidad(id) on delete cascade,
  primary key (area_id, modalidad_id)
);

create table categoria (
  id              uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizacion(id) on delete cascade,
  evento_id       uuid not null references evento(id) on delete cascade,
  modalidad_id    uuid not null references modalidad(id),
  nombre          text not null,
  sexo            text check (sexo in ('M','F','X')),
  edad_min        int,
  edad_max        int,
  peso_min        numeric(5,2),
  peso_max        numeric(5,2),
  clase           text check (clase in ('A','B','C')),
  nivel           text,
  formato         text not null default 'pactado'
                  check (formato in ('pactado','eliminacion_simple','eliminacion_doble','round_robin'))
);

create table inscripcion (
  id              uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizacion(id) on delete cascade,
  evento_id       uuid not null references evento(id) on delete cascade,
  peleador_id     uuid not null references peleador(id) on delete cascade,
  categoria_id    uuid references categoria(id) on delete set null,
  modalidad_id    uuid not null references modalidad(id),
  clase           text check (clase in ('A','B','C')),
  nivel           text not null default 'debutante'
                  check (nivel in ('debutante','novel_1','novel_2','intermedio','avanzado','seleccion')),
  categoria_pago  text not null default 'amateur'
                  check (categoria_pago in ('amateur','semi_pro','pro')),
  peso_declarado  numeric(5,2),
  peso_pesaje     numeric(5,2),
  peleas_previas  int not null default 0,
  token           text not null unique default encode(gen_random_bytes(6),'base32'),
  estado          text not null default 'pendiente'
                  check (estado in ('pendiente','pagada','pesada','aprobada','sin_rival','retirada','ausente')),
  creado_en       timestamptz not null default now(),
  unique (evento_id, peleador_id, modalidad_id)
);

create table llave (
  id              uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizacion(id) on delete cascade,
  categoria_id    uuid not null unique references categoria(id) on delete cascade,
  tamano          int not null,
  generada_en     timestamptz not null default now()
);

create table pelea (
  id                 uuid primary key default gen_random_uuid(),
  organizacion_id    uuid not null references organizacion(id) on delete cascade,
  evento_id          uuid not null references evento(id) on delete cascade,
  area_id            uuid references area(id) on delete set null,
  llave_id           uuid references llave(id) on delete cascade,
  tipo               text not null default 'pactado' check (tipo in ('pactado','bracket')),
  ronda              int,
  posicion           int,
  orden              int,
  roja_id            uuid references inscripcion(id) on delete set null,
  azul_id            uuid references inscripcion(id) on delete set null,
  siguiente_pelea_id uuid references pelea(id) on delete set null,
  siguiente_esquina  text check (siguiente_esquina in ('roja','azul')),
  rounds             int not null default 3,
  duracion_round_seg int not null default 120,
  descanso_seg       int not null default 60,
  con_resultado      boolean not null default true,
  duracion_est_seg   int generated always as
                     (rounds * duracion_round_seg + (rounds - 1) * descanso_seg + 180) stored,
  hora_estimada      timestamptz,
  hora_inicio_real   timestamptz,
  hora_fin_real      timestamptz,
  estado             text not null default 'pendiente'
                     check (estado in ('pendiente','lista','en_curso','finalizada','cancelada')),
  creado_en          timestamptz not null default now(),
  check (roja_id is null or azul_id is null or roja_id <> azul_id)
);

create unique index pelea_slot_unico on pelea (llave_id, ronda, posicion)
  where llave_id is not null;
create index pelea_cola on pelea (area_id, orden);

create table resultado (
  id             uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizacion(id) on delete cascade,
  pelea_id       uuid not null unique references pelea(id) on delete cascade,
  ganador_id     uuid references inscripcion(id) on delete set null,
  metodo         text not null,
  round          int,
  tiempo_seg     int,
  exhibicion     boolean not null default false,
  detalle        jsonb not null default '{}'::jsonb,
  registrado_por uuid references auth.users(id),
  registrado_en  timestamptz not null default now(),
  check (exhibicion or ganador_id is not null)
);

create table bloque (
  id              uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizacion(id) on delete cascade,
  evento_id       uuid not null references evento(id) on delete cascade,
  area_id         uuid references area(id) on delete cascade,
  tipo            text not null check (tipo in ('receso','ceremonia','premiacion','presentacion')),
  nombre          text not null,
  duracion_seg    int not null,
  despues_de_orden int not null
);

create index inscripcion_evento on inscripcion (evento_id, estado);
create index peleador_org on peleador (organizacion_id);
