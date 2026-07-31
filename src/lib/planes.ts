/**
 * Un plan pagado (evento/academia) es un cobro único por período: si venció y
 * no se renovó, la academia sigue existiendo pero vuelve a los límites del
 * plan Gratis. `organizacion.plan` no se revierte solo a "free" al vencer —
 * quien aplica el límite debe chequear plan_vence_en, no solo el nombre del plan.
 */
export function planEstaActivo(plan: string | null, planVenceEn: string | null): boolean {
  if (!plan || plan === "free") return false;
  if (!planVenceEn) return false;
  return new Date(planVenceEn) > new Date();
}

export const LIMITE_EVENTOS_GRATIS = 1;
export const LIMITE_INSCRITOS_GRATIS = 40;

/** Precio y duración del desbloqueo "Por evento", comprado desde un evento puntual. */
export const PRECIO_EVENTO_SOLES = 149;
export const DIAS_EVENTO = 45;

/**
 * El tope de 40 inscritos por evento se destraba de dos formas independientes:
 * el plan Academia (organización completa) o el desbloqueo puntual de ESE
 * evento (`evento.plan_vence_en`) — cualquiera de los dos alcanza, no hace
 * falta comprar los dos.
 */
export function eventoDesbloqueado(
  academiaPlan: string | null,
  academiaVenceEn: string | null,
  eventoVenceEn: string | null
): boolean {
  if (planEstaActivo(academiaPlan, academiaVenceEn)) return true;
  return Boolean(eventoVenceEn && new Date(eventoVenceEn) > new Date());
}
