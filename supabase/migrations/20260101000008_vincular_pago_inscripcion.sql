/**
 * Cierra el hueco documentado en docs/pending-task.md: ninguna vía de pago
 * llenaba pago_inscripcion, así que aprobar un pago nunca marcaba ninguna
 * inscripción como pagada (el trigger tr_aplicar_pago de
 * 20260101000005_pagos_y_coach.sql depende de esa tabla).
 *
 * "Mi club" paga de una vez por todos los inscritos pendientes de un club en
 * un evento (así está planteada esa pantalla), así que el vínculo se resuelve
 * ahí: al crear el pago se enlazan todas las inscripciones pendientes de ese
 * club en ese evento. Si más adelante se agrega selección por alumno, este
 * es el lugar para acotar el filtro.
 *
 * security definer porque se llama antes de aprobar el pago (con la sesión
 * del coach, no con service_role), pero valida contra mis_organizaciones()
 * como cualquier lectura normal — no es un salto de RLS "de verdad", solo
 * evita que el coach necesite permiso de escritura directo sobre pago para
 * poder leer inscripcion/peleador y armar el insert en un solo viaje.
 */
create or replace function vincular_pago_inscripciones(
  p_pago_id uuid,
  p_evento_id uuid,
  p_club_id uuid
)
returns void language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  if p_club_id is null then
    return;
  end if;

  select organizacion_id into v_org from pago where id = p_pago_id;
  if v_org is null or v_org not in (select mis_organizaciones()) then
    raise exception 'sin permiso sobre ese pago';
  end if;

  insert into pago_inscripcion (pago_id, inscripcion_id)
  select p_pago_id, i.id
  from inscripcion i
  join peleador pe on pe.id = i.peleador_id
  where i.evento_id = p_evento_id
    and i.organizacion_id = v_org
    and i.estado = 'pendiente'
    and pe.club_id = p_club_id
  on conflict do nothing;
end $$;
