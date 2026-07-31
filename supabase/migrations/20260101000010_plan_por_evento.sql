/**
 * Antes, comprar el plan "Por evento" activaba organizacion.plan_vence_en
 * para TODA la academia — comprarlo de nuevo para un segundo evento
 * sobrescribía el vencimiento del primero. Ahora cada evento tiene su
 * propio desbloqueo: se compra desde el evento puntual (ver
 * /api/pagos/evento) y solo afecta el tope de inscritos de ESE evento.
 *
 * El plan Academia sigue siendo por organización (cubre todos los eventos):
 * no se toca organizacion.plan_vence_en ni /api/pagos/plan para esos dos.
 */
alter table evento add column plan_vence_en timestamptz;

comment on column evento.plan_vence_en is
  'Vencimiento del desbloqueo "Por evento" comprado para este evento puntual (null = no comprado). El plan Academia de la organización cubre todos los eventos sin necesitar esto.';
