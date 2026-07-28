import { describe, expect, it } from "vitest";
import { construirAgenda, formatearRetraso, proximasPeleas } from "@/lib/horarios";
import type { Area, Bloque, Pelea } from "@/lib/types";

const INICIO = "2026-07-25T14:00:00.000Z";

const area: Area = {
  id: "a1",
  nombre: "Tatami 1",
  tipo: "tatami",
  hora_inicio: INICIO,
  orden: 1,
  modalidades: ["kick_light"],
};

function pelea(orden: number, extra: Partial<Pelea> = {}): Pelea {
  return {
    id: `p${orden}`,
    area_id: "a1",
    orden,
    roja_id: "r",
    azul_id: "z",
    rounds: 3,
    duracion_round_seg: 60,
    descanso_seg: 60,
    estado: "pendiente",
    hora_estimada: null,
    hora_inicio_real: null,
    hora_fin_real: null,
    ...extra,
  };
}

const min = (d: Date) => (d.getTime() - new Date(INICIO).getTime()) / 60000;

describe("construirAgenda", () => {
  it("encadena las peleas una detrás de otra", () => {
    const [ag] = construirAgenda(area ? [area] : [], [pelea(1), pelea(2)], []);
    // 3 rounds de 1 min + 2 descansos de 1 min + 3 min de protocolo = 8 min
    expect(min(ag.filas[0].inicio)).toBe(0);
    expect(min(ag.filas[0].fin)).toBe(8);
    expect(min(ag.filas[1].inicio)).toBe(8);
    expect(min(ag.finEstimado)).toBe(16);
  });

  it("aplica la duración según el formato de cada pelea", () => {
    const larga = pelea(1, { duracion_round_seg: 120 });
    const [ag] = construirAgenda([area], [larga], []);
    // 3 x 2 min + 2 x 1 min + 3 min = 11 min
    expect(min(ag.filas[0].fin)).toBe(11);
  });

  it("inserta los bloques después de la pelea indicada", () => {
    const bloque: Bloque = {
      id: "b1",
      area_id: "a1",
      nombre: "Break",
      duracion_seg: 1800,
      despues_de_orden: 1,
    };
    const [ag] = construirAgenda([area], [pelea(1), pelea(2)], [bloque]);
    expect(ag.filas[1].tipo).toBe("bloque");
    expect(ag.filas[1].nombre).toBe("Break");
    expect(min(ag.filas[2].inicio)).toBe(38);
  });

  it("recorre todo cuando una pelea termina tarde", () => {
    const tarde = pelea(1, {
      estado: "finalizada",
      hora_inicio_real: INICIO,
      hora_fin_real: "2026-07-25T14:20:00.000Z",
    });
    const [ag] = construirAgenda([area], [tarde, pelea(2)], []);
    expect(min(ag.filas[1].inicio)).toBe(20);
    expect(min(ag.finEstimado)).toBe(28);
  });

  it("calcula el retraso de la pelea en curso", () => {
    const enCurso = pelea(1, {
      estado: "en_curso",
      hora_inicio_real: "2026-07-25T14:25:00.000Z",
    });
    const [ag] = construirAgenda([area], [enCurso], []);
    expect(ag.retrasoSeg).toBe(1500);
  });

  it("ordena las áreas y respeta la hora de inicio de cada una", () => {
    const ring: Area = {
      ...area,
      id: "a2",
      nombre: "Ring",
      tipo: "ring",
      orden: 2,
      hora_inicio: "2026-07-25T16:00:00.000Z",
    };
    const enRing = pelea(1, { id: "r1", area_id: "a2" });
    const agendas = construirAgenda([ring, area], [pelea(1), enRing], []);
    expect(agendas.map((a) => a.area.nombre)).toEqual(["Tatami 1", "Ring"]);
    expect(min(agendas[1].filas[0].inicio)).toBe(120);
  });

  it("no cuenta las peleas de otras áreas", () => {
    const otra = pelea(1, { id: "x", area_id: "otra" });
    const [ag] = construirAgenda([area], [pelea(1), otra], []);
    expect(ag.filas).toHaveLength(1);
  });
});

describe("proximasPeleas", () => {
  it("devuelve las pendientes ordenadas por hora", () => {
    const agendas = construirAgenda(
      [area],
      [pelea(1, { estado: "finalizada", hora_fin_real: "2026-07-25T14:08:00.000Z" }), pelea(2), pelea(3)],
      []
    );
    const prox = proximasPeleas(agendas, 2);
    expect(prox).toHaveLength(2);
    expect(prox[0].id).toBe("p2");
  });
});

describe("formatearRetraso", () => {
  it("considera en hora una diferencia menor a dos minutos", () => {
    expect(formatearRetraso(90)).toBe("en hora");
  });
  it("expresa minutos y horas", () => {
    expect(formatearRetraso(1500)).toBe("25 min de retraso");
    expect(formatearRetraso(4200)).toBe("1 h 10 min de retraso");
  });
  it("reconoce el adelanto", () => {
    expect(formatearRetraso(-600)).toBe("10 min adelantado");
  });
});
