import { describe, expect, it } from "vitest";
import { emparejar, evaluarCruce, alternativasPara } from "@/lib/emparejador";
import type { Inscripcion } from "@/types";

let n = 0;
function ins(p: Partial<Inscripcion> = {}): Inscripcion {
  n++;
  return {
    id: `i${n}`,
    peleador_id: `p${n}`,
    nombre: `Peleador ${n}`,
    club_id: `c${n}`,
    club: `Club ${n}`,
    sexo: "M",
    edad: 20,
    peso_pesaje: 60,
    modalidades: ["low_kick"],
    clase: "A",
    nivel: "debutante",
    estado: "pesada",
    ...p,
  };
}

describe("evaluarCruce", () => {
  it("acepta dos peleadores del mismo peso y edad", () => {
    const r = evaluarCruce(ins(), ins());
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.cruce.score).toBe(100);
  });

  it("rechaza a dos del mismo club", () => {
    const r = evaluarCruce(ins({ club_id: "x" }), ins({ club_id: "x" }));
    expect(r).toMatchObject({ ok: false, motivo: "mismo club" });
  });

  it("rechaza modalidades que no se cruzan", () => {
    const r = evaluarCruce(ins({ modalidades: ["low_kick"] }), ins({ modalidades: ["kick_light"] }));
    expect(r).toMatchObject({ ok: false, motivo: "modalidad incompatible" });
  });

  it("rechaza sexos distintos", () => {
    const r = evaluarCruce(ins({ sexo: "M" }), ins({ sexo: "F" }));
    expect(r).toMatchObject({ ok: false, motivo: "sexo distinto" });
  });

  it("rechaza si falta el peso de pesaje", () => {
    const r = evaluarCruce(ins({ peso_pesaje: null }), ins());
    expect(r).toMatchObject({ ok: false, motivo: "sin peso de pesaje" });
  });

  it("rechaza una diferencia de peso mayor al 10%", () => {
    const r = evaluarCruce(ins({ peso_pesaje: 60 }), ins({ peso_pesaje: 70 }));
    expect(r).toMatchObject({ ok: false, motivo: "diferencia de peso" });
  });

  it("rechaza una diferencia de edad mayor a 3 años", () => {
    const r = evaluarCruce(ins({ edad: 14 }), ins({ edad: 20 }));
    expect(r).toMatchObject({ ok: false, motivo: "diferencia de edad" });
  });

  it("penaliza el nivel distinto pero no lo prohíbe", () => {
    const r = evaluarCruce(ins({ nivel: "debutante" }), ins({ nivel: "avanzado" }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.cruce.score).toBe(75);
  });

  it("penaliza cuando falta la edad", () => {
    const r = evaluarCruce(ins({ edad: null }), ins());
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.cruce.score).toBe(92);
  });

  it("permite el mismo club si la regla se desactiva", () => {
    const r = evaluarCruce(ins({ club_id: "x" }), ins({ club_id: "x" }), {
      maxDifPesoPct: 10,
      maxDifEdad: 3,
      puntosPorPctPeso: 6,
      puntosPorAnio: 5,
      penalNivelDistinto: 25,
      penalSinEdad: 8,
      permitirMismoClub: true,
    });
    expect(r.ok).toBe(true);
  });
});

describe("emparejar", () => {
  it("empareja a los más parecidos entre sí", () => {
    const a = ins({ peso_pesaje: 60 });
    const b = ins({ peso_pesaje: 60.2 });
    const c = ins({ peso_pesaje: 64 });
    const d = ins({ peso_pesaje: 64.1 });
    const { parejas, sinRival } = emparejar([a, c, b, d]);
    expect(parejas).toHaveLength(2);
    expect(sinRival).toHaveLength(0);
    const ids = parejas.map((p) => [p.a.id, p.b.id].sort().join("-")).sort();
    expect(ids).toEqual([[a.id, b.id].sort().join("-"), [c.id, d.id].sort().join("-")].sort());
  });

  it("deja sin rival a quien no tiene cruce válido", () => {
    const { parejas, sinRival } = emparejar([ins({ peso_pesaje: 60 }), ins({ peso_pesaje: 95 })]);
    expect(parejas).toHaveLength(0);
    expect(sinRival).toHaveLength(2);
  });

  it("nunca usa a un peleador dos veces", () => {
    const lista = Array.from({ length: 25 }, (_, i) => ins({ peso_pesaje: 60 + i * 0.2 }));
    const { parejas } = emparejar(lista);
    const usados = parejas.flatMap((p) => [p.a.id, p.b.id]);
    expect(new Set(usados).size).toBe(usados.length);
  });

  it("ignora a los retirados y ausentes", () => {
    const { parejas, sinRival } = emparejar([
      ins(),
      ins({ estado: "retirada" }),
      ins({ estado: "ausente" }),
    ]);
    expect(parejas).toHaveLength(0);
    expect(sinRival).toHaveLength(1);
  });

  it("cuenta los motivos de rechazo", () => {
    const { rechazos } = emparejar([ins({ club_id: "x" }), ins({ club_id: "x" })]);
    expect(rechazos["mismo club"]).toBe(1);
  });
});

describe("alternativasPara", () => {
  it("ordena de mejor a peor y respeta el límite", () => {
    const objetivo = ins({ peso_pesaje: 60 });
    const candidatos = [
      ins({ peso_pesaje: 63 }),
      ins({ peso_pesaje: 60.1 }),
      ins({ peso_pesaje: 61.5 }),
    ];
    const alt = alternativasPara(objetivo, candidatos, undefined, 2);
    expect(alt).toHaveLength(2);
    expect(alt[0].score).toBeGreaterThan(alt[1].score);
    expect(alt[0].b.peso_pesaje).toBe(60.1);
  });
});
