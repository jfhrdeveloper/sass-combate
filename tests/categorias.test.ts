import { describe, expect, it } from "vitest";
import { categoriaDePeso } from "@/lib/categorias";
import type { CategoriaPeso } from "@/types";

function cat(p: Partial<CategoriaPeso> = {}): CategoriaPeso {
  return {
    id: "c1",
    nombre: "Peso pluma",
    sexo: null,
    peso_min: null,
    peso_max: null,
    modalidad: "boxeo",
    ...p,
  };
}

describe("categoriaDePeso", () => {
  it("devuelve null sin peso de pesaje", () => {
    expect(categoriaDePeso([cat({ peso_min: 50, peso_max: 60 })], null, null)).toBeNull();
  });

  it("devuelve null sin categorías definidas", () => {
    expect(categoriaDePeso([], 57, null)).toBeNull();
  });

  it("encuentra la categoría cuyo rango contiene el peso", () => {
    const pluma = cat({ id: "pluma", nombre: "Peso pluma", peso_min: 55, peso_max: 60 });
    const mosca = cat({ id: "mosca", nombre: "Peso mosca", peso_min: 48, peso_max: 51 });
    expect(categoriaDePeso([mosca, pluma], 57, null)?.id).toBe("pluma");
  });

  it("un peso exacto es peso_min === peso_max", () => {
    const exacta = cat({ id: "exacta", peso_min: 57, peso_max: 57 });
    expect(categoriaDePeso([exacta], 57, null)?.id).toBe("exacta");
    expect(categoriaDePeso([exacta], 57.1, null)).toBeNull();
  });

  it("respeta el límite inferior y superior del rango", () => {
    const c = cat({ peso_min: 55, peso_max: 60 });
    expect(categoriaDePeso([c], 54.9, null)).toBeNull();
    expect(categoriaDePeso([c], 60.1, null)).toBeNull();
    expect(categoriaDePeso([c], 55, null)).not.toBeNull();
    expect(categoriaDePeso([c], 60, null)).not.toBeNull();
  });

  it("filtra por sexo cuando la categoría lo restringe", () => {
    const femenino = cat({ id: "f", sexo: "F", peso_min: 55, peso_max: 60 });
    expect(categoriaDePeso([femenino], 57, "M")).toBeNull();
    expect(categoriaDePeso([femenino], 57, "F")?.id).toBe("f");
  });

  it("una categoría sin sexo definido aplica a cualquiera", () => {
    const mixta = cat({ id: "mixta", peso_min: 55, peso_max: 60 });
    expect(categoriaDePeso([mixta], 57, "M")?.id).toBe("mixta");
    expect(categoriaDePeso([mixta], 57, "F")?.id).toBe("mixta");
    expect(categoriaDePeso([mixta], 57, null)?.id).toBe("mixta");
  });

  it("ignora una categoría sin rango definido (evita matchear todo)", () => {
    const vacia = cat({ id: "vacia", peso_min: null, peso_max: null });
    expect(categoriaDePeso([vacia], 57, null)).toBeNull();
  });
});
