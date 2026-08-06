/**
 * Descuento por pago.
 *
 * El cobro de inscripción lo controla cada academia a su manera (ver
 * docs/pending-task.md, sesión 2026-08-06) y puede incluir un descuento que
 * ella misma decide. El descuento se aplica al aprobar el pago (dueño/admin,
 * la política pago_revision ya les da permiso de update sobre esta fila) y
 * es puntual por pago, no una configuración reutilizable por club — eso
 * puede llegar más adelante si hace falta.
 */
alter table pago
  add column descuento_tipo  text check (descuento_tipo in ('monto', 'porcentaje')),
  add column descuento_valor numeric(8,2) check (descuento_valor >= 0);

alter table pago
  add constraint pago_descuento_par
    check ((descuento_tipo is null) = (descuento_valor is null)),
  add constraint pago_descuento_porcentaje_max
    check (descuento_tipo <> 'porcentaje' or descuento_valor <= 100);

/** Monto realmente cobrado tras el descuento — nunca baja de 0. */
alter table pago add column monto_final numeric(8,2) generated always as (
  greatest(
    0,
    monto - coalesce(
      case descuento_tipo
        when 'monto' then descuento_valor
        when 'porcentaje' then round(monto * descuento_valor / 100, 2)
      end,
      0
    )
  )
) stored;
