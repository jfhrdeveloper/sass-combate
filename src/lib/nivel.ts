import type { Nivel } from "./types";

/** Cortes de las bases WAKO, en el mismo orden que la función SQL nivel_por_peleas. */
const CORTES: Array<[number, Nivel]> = [
  [1, "debutante"],
  [3, "novel_1"],
  [5, "novel_2"],
  [11, "intermedio"],
  [20, "avanzado"],
];

export function nivelPorPeleas(peleas: number | null): Nivel {
  if (peleas == null) return "debutante";
  for (const [tope, nivel] of CORTES) {
    if (peleas <= tope) return nivel;
  }
  return "seleccion";
}

export const ETIQUETA_NIVEL: Record<Nivel, string> = {
  debutante: "Debutante",
  novel_1: "Novel 1",
  novel_2: "Novel 2",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
  seleccion: "Selección",
};

/** Compara lo que declaró el atleta con lo que dice su historial. */
export function discrepanciaDeNivel(
  declarado: Nivel,
  peleasReales: number | null
): { hay: boolean; sugerido: Nivel } {
  const sugerido = nivelPorPeleas(peleasReales);
  const orden: Nivel[] = [
    "debutante",
    "novel_1",
    "novel_2",
    "intermedio",
    "avanzado",
    "seleccion",
  ];
  return { hay: orden.indexOf(sugerido) > orden.indexOf(declarado), sugerido };
}
