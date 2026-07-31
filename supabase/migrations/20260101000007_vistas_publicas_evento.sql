/**
 * Vistas públicas que faltaban para que /e/[org]/[evento] y /p/[token] puedan
 * leer datos reales de Supabase en vez de PELEAS_DEMO/EVENTO_DEMO.
 *
 * v_publico_pelea ya existía (20260101000002) y ya estaba abierta a "anon",
 * pero le faltaban las columnas crudas (area_id, roja_id, azul_id, horas
 * reales) que necesita construirAgenda() para calcular el horario igual que
 * en modo demo. Se le agregan al final para no romper a quien ya la usa
 * (src/app/sitemap.ts solo pide organizacion_slug/evento_slug por nombre).
 */
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
       r.metodo,
       p.area_id, p.roja_id, p.azul_id, p.descanso_seg,
       p.hora_inicio_real, p.hora_fin_real
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

/** Metadata del evento (nombre/fecha/sede) para generateMetadata y el JSON-LD. */
create or replace view v_publico_evento
with (security_invoker = false) as
select e.id, e.slug as evento_slug, o.slug as organizacion_slug,
       e.nombre, e.fecha, e.sede, e.zona_horaria
from evento e
join organizacion o on o.id = e.organizacion_id
where e.publico;

grant select on v_publico_evento to anon;

/** Áreas del evento, para reconstruir la agenda con construirAgenda(). */
create or replace view v_publico_area
with (security_invoker = false) as
select a.id, a.evento_id, a.nombre, a.tipo, a.hora_inicio, a.orden
from area a
join evento e on e.id = a.evento_id and e.publico;

grant select on v_publico_area to anon;

/** Bloques (recesos, premiación, etc.) del evento, misma razón que el área. */
create or replace view v_publico_bloque
with (security_invoker = false) as
select b.id, b.area_id, b.evento_id, b.nombre, b.duracion_seg, b.despues_de_orden
from bloque b
join evento e on e.id = b.evento_id and e.publico;

grant select on v_publico_bloque to anon;
