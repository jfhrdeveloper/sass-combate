create or replace function mis_organizaciones()
returns setof uuid
language sql stable security definer set search_path = public
as $$ select organizacion_id from miembro where usuario_id = auth.uid() $$;

create or replace function puede_editar(org uuid)
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from miembro
  where usuario_id = auth.uid() and organizacion_id = org
    and rol in ('dueno','admin','mesa')
) $$;

alter table organizacion enable row level security;
alter table miembro     enable row level security;

create policy org_lectura on organizacion for select
  using (id in (select mis_organizaciones()));
create policy org_edicion on organizacion for update
  using (puede_editar(id));
create policy miembro_lectura on miembro for select
  using (organizacion_id in (select mis_organizaciones()));

do $$
declare t text;
begin
  foreach t in array array['club','peleador','evento','area','categoria','inscripcion',
                           'llave','pelea','resultado','bloque']
  loop
    execute format('alter table %I enable row level security', t);
    execute format($p$create policy %1$s_lectura on %1$I for select
                     using (organizacion_id in (select mis_organizaciones()))$p$, t);
    execute format($p$create policy %1$s_escritura on %1$I for all
                     using (puede_editar(organizacion_id))
                     with check (puede_editar(organizacion_id))$p$, t);
  end loop;
end $$;

create or replace view v_publico_pelea
with (security_invoker = false) as
select p.id, p.evento_id, e.slug as evento_slug, o.slug as organizacion_slug,
       a.nombre as area, p.orden, p.hora_estimada, p.estado,
       m.nombre as modalidad, p.rounds, p.duracion_round_seg,
       (pr.nombres || ' ' || pr.apellidos) as roja, cr.nombre as club_roja,
       (pa.nombres || ' ' || pa.apellidos) as azul, ca.nombre as club_azul,
       case when r.exhibicion then 'exhibicion'
            when r.ganador_id = p.roja_id then 'roja'
            when r.ganador_id = p.azul_id then 'azul' end as gano,
       r.metodo
from pelea p
join evento e on e.id = p.evento_id and e.publico
join organizacion o on o.id = e.organizacion_id
left join area a on a.id = p.area_id
left join inscripcion ir on ir.id = p.roja_id
left join inscripcion ia on ia.id = p.azul_id
left join modalidad m on m.id = coalesce(ir.modalidad_id, ia.modalidad_id)
left join peleador pr on pr.id = ir.peleador_id
left join peleador pa on pa.id = ia.peleador_id
left join club cr on cr.id = pr.club_id
left join club ca on ca.id = pa.club_id
left join resultado r on r.pelea_id = p.id;

grant select on v_publico_pelea to anon;

create or replace function avanzar_ganador()
returns trigger language plpgsql as $$
declare sig uuid; esq text;
begin
  select siguiente_pelea_id, siguiente_esquina into sig, esq
  from pelea where id = new.pelea_id;
  if sig is null or new.ganador_id is null then
    return new;
  end if;
  if esq = 'roja' then
    update pelea set roja_id = new.ganador_id where id = sig;
  else
    update pelea set azul_id = new.ganador_id where id = sig;
  end if;
  update pelea set estado = 'lista'
   where id = sig and roja_id is not null and azul_id is not null;
  return new;
end $$;

create trigger tr_avanzar_ganador
after insert or update of ganador_id on resultado
for each row execute function avanzar_ganador();

create or replace function recalcular_horarios(p_evento_id uuid)
returns void language plpgsql as $$
declare
  a record; f record; reloj timestamptz; extra int;
begin
  for a in select id, hora_inicio from area where evento_id = p_evento_id order by orden loop
    reloj := a.hora_inicio;
    for f in select id, orden, duracion_est_seg, hora_fin_real, estado
               from pelea where area_id = a.id order by orden loop
      if f.hora_fin_real is not null then
        reloj := f.hora_fin_real;
      else
        update pelea set hora_estimada = reloj where id = f.id;
        reloj := reloj + make_interval(secs => f.duracion_est_seg);
      end if;
      select coalesce(sum(duracion_seg), 0) into extra
        from bloque where area_id = a.id and despues_de_orden = f.orden;
      reloj := reloj + make_interval(secs => extra);
    end loop;
  end loop;
end $$;
