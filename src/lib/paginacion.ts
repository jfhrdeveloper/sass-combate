/** Convención del proyecto: cualquier lista de más de 8 elementos pagina en escritorio. */
export const TAMANO_PAGINA = 8;
/** En mobile, el corte baja a 4 (ver `DetectorAncho` y `tamanoPaginaActual`). */
export const TAMANO_PAGINA_MOVIL = 4;

/** Mismo breakpoint `sm` de Tailwind (640px) — no redeclarar el número suelto en otro lado. */
export const BREAKPOINT_MOVIL = 640;
export const COOKIE_ANCHO_PANTALLA = "ancho_pantalla";

export interface Pagina<T> {
  items: T[];
  pagina: number;
  totalPaginas: number;
}

/** Recorta `items` a la página pedida. `pagina` fuera de rango se ajusta sola. */
export function paginar<T>(items: T[], pagina: number, tamano = TAMANO_PAGINA): Pagina<T> {
  const totalPaginas = Math.max(1, Math.ceil(items.length / tamano));
  const paginaSegura = Math.min(Math.max(1, Math.trunc(pagina) || 1), totalPaginas);
  const inicio = (paginaSegura - 1) * tamano;

  return {
    items: items.slice(inicio, inicio + tamano),
    pagina: paginaSegura,
    totalPaginas,
  };
}

/**
 * Lee la cookie que deja `DetectorAncho` para saber si la pantalla que pidió
 * la página es mobile. Sin la cookie (primera visita, antes de que el
 * cliente corra el efecto) cae a escritorio (8) — mismo tamaño que ya tenía
 * el proyecto antes de esta regla, para no regresionar esa primera carga.
 */
export async function tamanoPaginaActual(): Promise<number> {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  return jar.get(COOKIE_ANCHO_PANTALLA)?.value === "movil" ? TAMANO_PAGINA_MOVIL : TAMANO_PAGINA;
}
