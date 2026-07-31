/**
 * Expone en v_publico_pelea las columnas de llave (bracket de eliminación
 * directa, típico de MMA) que ya existían en el esquema desde el principio
 * (`pelea.tipo`/`llave_id`/`ronda`/`posicion`, migración 20260101000001) pero
 * nunca se leían desde ningún lado del código — nada generaba llaves
 * todavía, así que no hacía falta exponerlas. `/e/[org]/[evento]` ya sabe
 * dibujar el árbol si estas columnas vienen pobladas (ver
 * agenda-con-busqueda.tsx); si `llave_id` es null (el caso de siempre hasta
 * hoy), simplemente no se renderiza ninguna sección de llaves.
 *
 * Mismo patrón que 20260101000007: se agregan columnas al final, sin tocar
 * las que ya existían, para no romper a quien ya usa esta vista.
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
       p.hora_inicio_real, p.hora_fin_real,
       p.tipo, p.llave_id, p.ronda, p.posicion
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
