import { formatInTimeZone } from "date-fns-tz";

export const ZONA = "America/Lima";

export function hora(fecha: Date | string | null): string {
  if (!fecha) return "--:--";
  return formatInTimeZone(new Date(fecha), ZONA, "HH:mm");
}

export function fechaLarga(fecha: Date | string): string {
  return formatInTimeZone(new Date(fecha), ZONA, "dd/MM/yyyy");
}

export function fechaHora(fecha: Date | string): string {
  return formatInTimeZone(new Date(fecha), ZONA, "dd/MM/yyyy HH:mm");
}

export function edadA(nacimiento: string | null, referencia: Date | string): number | null {
  if (!nacimiento) return null;
  const n = new Date(nacimiento);
  const r = new Date(referencia);
  let e = r.getFullYear() - n.getFullYear();
  const m = r.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && r.getDate() < n.getDate())) e--;
  return e;
}

export function kg(v: number | null): string {
  return v == null ? "—" : `${v.toFixed(1)} kg`;
}
