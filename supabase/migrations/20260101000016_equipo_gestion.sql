/**
 * Gestión de equipo: la pantalla de Equipo solo dejaba invitar, nunca ver
 * quién ya es miembro ni sacar a alguien (ver docs/pending-task.md, sesión
 * de hoy). `miembro` no tenía ninguna política de escritura fuera de las
 * funciones `security definer` que la insertan (`crear_academia`,
 * `aceptar_invitacion`), así que eliminar a alguien necesitaba una política
 * nueva. Cancelar una invitación ya funcionaba (`invitacion_escritura for
 * all`, sesión del primer commit) — no hizo falta tocar esa tabla.
 */
create policy miembro_eliminacion on miembro for delete
  using (
    exists (
      select 1 from miembro m
       where m.usuario_id = auth.uid()
         and m.organizacion_id = miembro.organizacion_id
         and m.rol in ('dueno', 'admin')
    )
  );

/**
 * `miembro.usuario_id` referencia auth.users, no perfil directamente (mismo
 * caso que `v_auditoria`, migración 20260101000015): PostgREST no puede
 * embeber `perfil` solo, así que el join va explícito acá. Se apoya en la
 * política `perfil_companeros` de esa misma migración para resolver el
 * nombre de un compañero de equipo.
 */
create or replace view v_equipo
with (security_invoker = true) as
select m.id, m.organizacion_id, m.usuario_id, m.rol, m.creado_en,
       p.nombre, p.email
from miembro m
left join perfil p on p.id = m.usuario_id;

grant select on v_equipo to authenticated;
