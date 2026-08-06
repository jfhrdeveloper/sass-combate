/**
 * La pantalla de auditoría mostraba el UUID crudo de `usuario_id` en vez del
 * nombre de quien hizo el cambio (ver docs/pending-task.md, sesión de hoy).
 * `perfil` solo dejaba leer el propio perfil (`perfil_propio`), así que el
 * dueño/admin que revisa la auditoría no podía resolver el nombre de un
 * compañero de equipo (mesa, coach, etc.) aunque comparta organización.
 *
 * Se agrega una política adicional (además de `perfil_propio`, que sigue
 * intacta) para leer el perfil de cualquiera que comparta al menos una
 * organización vía `miembro` — mismo patrón que ya usa `mis_organizaciones()`.
 */
create policy perfil_companeros on perfil for select
  using (
    id in (
      select m2.usuario_id
      from miembro m1
      join miembro m2 on m2.organizacion_id = m1.organizacion_id
      where m1.usuario_id = auth.uid()
    )
  );

/**
 * `auditoria.usuario_id` referencia auth.users, no perfil directamente, así
 * que PostgREST no puede embeber `perfil` automáticamente. Esta vista hace el
 * join explícito; `security_invoker = true` respeta la RLS del usuario que
 * consulta en ambas tablas (auditoria_lectura y las políticas de perfil de
 * arriba), así que un nombre solo se resuelve si de verdad se puede leer.
 */
create or replace view v_auditoria
with (security_invoker = true) as
select
  a.id, a.organizacion_id, a.tabla, a.registro_id, a.accion, a.antes, a.despues,
  a.usuario_id, p.nombre as usuario_nombre, p.email as usuario_email, a.creado_en
from auditoria a
left join perfil p on p.id = a.usuario_id;

grant select on v_auditoria to authenticated;
