import type { CategoriaPeso, Sexo } from "@/types";

/**
 * Encuentra la categoría de peso que le corresponde a un peso (y sexo, si la
 * categoría lo restringe). Es solo una etiqueta visual — ver la nota en
 * `CategoriaPeso` sobre por qué no toca el emparejador.
 *
 * Un peso puede caer en más de una categoría si el organizador definió rangos
 * superpuestos por error; gana la primera en el orden en que las devolvió la
 * consulta (mismo criterio simple que el resto del proyecto, sin inventar una
 * regla de desempate que nadie pidió).
 */
export function categoriaDePeso(
  categorias: CategoriaPeso[],
  peso: number | null,
  sexo: Sexo | null
): CategoriaPeso | null {
  if (peso == null) return null;

  return (
    categorias.find((c) => {
      if (c.sexo && sexo && c.sexo !== sexo) return false;
      if (c.peso_min != null && peso < c.peso_min) return false;
      if (c.peso_max != null && peso > c.peso_max) return false;
      return c.peso_min != null || c.peso_max != null;
    }) ?? null
  );
}
