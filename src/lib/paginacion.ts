/** Convención del proyecto: cualquier lista de más de 8 elementos pagina. */
export const TAMANO_PAGINA = 8;

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
