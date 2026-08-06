export type TipoDescuento = "monto" | "porcentaje";

export interface Descuento {
  tipo: TipoDescuento;
  valor: number;
}

/**
 * Resta un descuento (monto fijo en soles o porcentaje) sobre un total, sin
 * bajar de 0. Replica la columna generada `pago.monto_final` en
 * supabase/migrations/20260101000014_descuento_pago.sql — deben mantenerse
 * sincronizadas si cambia la fórmula.
 */
export function aplicarDescuento(total: number, descuento: Descuento | null): number {
  if (!descuento) return total;
  const rebaja =
    descuento.tipo === "porcentaje" ? total * (descuento.valor / 100) : descuento.valor;
  return Math.max(0, Math.round((total - rebaja) * 100) / 100);
}
