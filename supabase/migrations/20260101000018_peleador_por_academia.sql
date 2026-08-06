/**
 * Cada academia maneja su propio registro de peleadores, sin mezclar datos
 * ni conteos con otras academias — decisión explícita del usuario, sesión
 * del 2026-08-06 ("las academias no comparten información"). `peleador` ya
 * guardaba sus propios nombres/apellidos/documento/nacimiento/sexo desde el
 * esquema base; esta vista calcula el récord/nivel solo sobre el historial
 * que registró ESA organización, en vez de mezclar el de todas como hacía
 * `v_resumen_atleta` (que se deja intacta en el schema, sin uso desde la
 * app, por si hace falta revisar el diseño anterior).
 *
 * `peleador.atleta_id` (enlace al registro compartido por documento) sigue
 * existiendo por dentro: es lo único que necesita el trigger
 * `registrar_en_historial()` para saber a quién anotarle un resultado, y lo
 * que hace posible `peleas_otras_academias()` de abajo. Nunca se expone
 * como concepto al usuario ni se usa para mezclar datos de display —
 * nombre/documento/nacimiento que ve cada academia siempre salen de SU
 * PROPIA fila de `peleador`, nunca de `atleta`.
 */
create or replace view v_mi_peleador
with (security_invoker = true) as
select
  p.id,
  p.organizacion_id,
  p.club_id,
  p.atleta_id,
  p.documento,
  p.nombres,
  p.apellidos,
  p.nacimiento,
  p.sexo,
  count(h.id) filter (where h.resultado in ('victoria', 'derrota', 'empate') and h.organizacion_id = p.organizacion_id)::int as peleas,
  count(h.id) filter (where h.resultado = 'victoria' and h.organizacion_id = p.organizacion_id)::int as victorias,
  count(h.id) filter (where h.resultado = 'derrota' and h.organizacion_id = p.organizacion_id)::int as derrotas,
  count(h.id) filter (where h.resultado = 'empate' and h.organizacion_id = p.organizacion_id)::int as empates,
  max(h.fecha) filter (where h.organizacion_id = p.organizacion_id) as ultima_pelea,
  array_agg(distinct h.disciplina) filter (where h.disciplina is not null and h.organizacion_id = p.organizacion_id) as disciplinas
from peleador p
left join historial_pelea h on h.atleta_id = p.atleta_id
group by p.id, p.organizacion_id, p.club_id, p.atleta_id, p.documento, p.nombres, p.apellidos, p.nacimiento, p.sexo;

grant select on v_mi_peleador to authenticated;

/**
 * Único cruce entre academias que existe a propósito: cuenta (sin exponer
 * ningún detalle de evento/rival/club) cuántas peleas tiene registradas
 * OTRA organización para alguien con el mismo documento. Se llama solo bajo
 * demanda (botón "Buscar en otras academias" de la UI), nunca automático.
 * `security definer` porque `historial_lectura` no deja ver filas de otra
 * organización — acá se verifica a propósito, mismo patrón que ya usa
 * `vincular_pago_inscripciones` para otro caso.
 */
create or replace function peleas_otras_academias(p_documento text, p_organizacion_id uuid)
returns int
language sql stable security definer set search_path = public as $$
  select count(h.id)::int
  from atleta a
  join historial_pelea h on h.atleta_id = a.id
  where a.documento = p_documento
    and h.organizacion_id is not null
    and h.organizacion_id <> p_organizacion_id
$$;
