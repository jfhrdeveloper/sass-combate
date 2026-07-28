import { describe, expect, it } from "vitest";
import { discrepanciaDeNivel, nivelPorPeleas } from "@/lib/nivel";

describe("nivelPorPeleas", () => {
  it("usa los cortes de las bases", () => {
    expect(nivelPorPeleas(0)).toBe("debutante");
    expect(nivelPorPeleas(1)).toBe("debutante");
    expect(nivelPorPeleas(2)).toBe("novel_1");
    expect(nivelPorPeleas(3)).toBe("novel_1");
    expect(nivelPorPeleas(4)).toBe("novel_2");
    expect(nivelPorPeleas(5)).toBe("novel_2");
    expect(nivelPorPeleas(6)).toBe("intermedio");
    expect(nivelPorPeleas(11)).toBe("intermedio");
    expect(nivelPorPeleas(12)).toBe("avanzado");
    expect(nivelPorPeleas(20)).toBe("avanzado");
    expect(nivelPorPeleas(21)).toBe("seleccion");
  });

  it("trata la falta de historial como debutante", () => {
    expect(nivelPorPeleas(null)).toBe("debutante");
  });
});

describe("discrepanciaDeNivel", () => {
  it("detecta a quien se declara por debajo de su historial", () => {
    const r = discrepanciaDeNivel("debutante", 8);
    expect(r.hay).toBe(true);
    expect(r.sugerido).toBe("intermedio");
  });

  it("no alerta cuando el declarado coincide", () => {
    expect(discrepanciaDeNivel("intermedio", 8).hay).toBe(false);
  });

  it("no alerta cuando se declara por encima", () => {
    expect(discrepanciaDeNivel("avanzado", 3).hay).toBe(false);
  });
});
