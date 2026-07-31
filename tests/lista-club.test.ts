import { describe, expect, it } from "vitest";
import { analizarLista, separarValidas } from "@/utils/lista-club";

const BUENA = "Jamil Zarate\t70123456\t2011-03-14\tM\t57\tlow_kick";

describe("analizarLista", () => {
  it("lee una línea separada por tabulaciones", () => {
    const [f] = analizarLista(BUENA);
    expect(f.error).toBeUndefined();
    expect(f.nombre).toBe("Jamil Zarate");
    expect(f.documento).toBe("70123456");
    expect(f.modalidad).toBe("low_kick");
  });

  it("acepta punto y coma, comas y espacios múltiples", () => {
    const variantes = [
      "Jamil Zarate;70123456;2011-03-14;M;57;low_kick",
      "Jamil Zarate,70123456,2011-03-14,M,57,low_kick",
      "Jamil Zarate   70123456   2011-03-14   M   57   low_kick",
    ];
    for (const v of variantes) {
      expect(analizarLista(v)[0].error).toBeUndefined();
    }
  });

  it("normaliza el sexo en minúscula y la modalidad en mayúscula", () => {
    const [f] = analizarLista("Jamil Zarate\t70123456\t2011-03-14\tm\t57\tLOW_KICK");
    expect(f.error).toBeUndefined();
    expect(f.sexo).toBe("M");
    expect(f.modalidad).toBe("low_kick");
  });

  it("acepta el peso con coma decimal", () => {
    expect(analizarLista("Ana Perez\t70123456\t2011-03-14\tF\t56,6\tk1")[0].error).toBeUndefined();
  });

  it("ignora líneas vacías", () => {
    expect(analizarLista(`\n${BUENA}\n\n`)).toHaveLength(1);
  });

  it("señala cada problema por separado", () => {
    const casos: Array<[string, string]> = [
      ["Jamil\t70123456\t2011-03-14\tM\t57\tlow_kick", "Falta el apellido"],
      ["Jamil Zarate\t123\t2011-03-14\tM\t57\tlow_kick", "Documento no válido"],
      ["Jamil Zarate\t70123456\t14/03/2011\tM\t57\tlow_kick", "La fecha debe ir como 2011-03-14"],
      ["Jamil Zarate\t70123456\t2011-03-14\tX\t57\tlow_kick", "El sexo debe ser M o F"],
      ["Jamil Zarate\t70123456\t2011-03-14\tM\tpesado\tlow_kick", "Peso no válido"],
      ["Jamil Zarate\t70123456\t2011-03-14\tM\t57\t", "Falta la modalidad"],
    ];
    for (const [linea, esperado] of casos) {
      expect(analizarLista(linea)[0].error).toBe(esperado);
    }
  });
});

describe("separarValidas", () => {
  it("permite enviar las buenas aunque haya errores", () => {
    const filas = analizarLista(`${BUENA}\nJamil\t123\tmal\tX\tno\t`);
    const { validas, conError } = separarValidas(filas);
    expect(validas).toHaveLength(1);
    expect(conError).toHaveLength(1);
  });
});
