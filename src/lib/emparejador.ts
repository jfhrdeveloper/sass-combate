import type { Inscripcion, ModalidadCodigo } from "./types";

export interface ReglasEmparejamiento {
  maxDifPesoPct: number;
  maxDifEdad: number;
  puntosPorPctPeso: number;
  puntosPorAnio: number;
  penalNivelDistinto: number;
  penalSinEdad: number;
  permitirMismoClub: boolean;
}

export const REGLAS_POR_DEFECTO: ReglasEmparejamiento = {
  maxDifPesoPct: 10,
  maxDifEdad: 3,
  puntosPorPctPeso: 6,
  puntosPorAnio: 5,
  penalNivelDistinto: 25,
  penalSinEdad: 8,
  permitirMismoClub: false,
};

export type MotivoRechazo =
  | "mismo club"
  | "modalidad incompatible"
  | "sexo distinto"
  | "sin peso de pesaje"
  | "diferencia de peso"
  | "diferencia de edad";

export interface Cruce {
  a: Inscripcion;
  b: Inscripcion;
  score: number;
  modalidad: ModalidadCodigo;
  criterio: string;
}

export type Evaluacion =
  | { ok: true; cruce: Cruce }
  | { ok: false; motivo: MotivoRechazo };

const ESTADOS_EMPAREJABLES = new Set(["pendiente", "pagada", "pesada", "aprobada", "sin_rival"]);

export function evaluarCruce(
  a: Inscripcion,
  b: Inscripcion,
  reglas: ReglasEmparejamiento = REGLAS_POR_DEFECTO
): Evaluacion {
  if (!reglas.permitirMismoClub && a.club_id && b.club_id && a.club_id === b.club_id) {
    return { ok: false, motivo: "mismo club" };
  }

  const comunes = a.modalidades.filter((m) => b.modalidades.includes(m));
  if (comunes.length === 0) return { ok: false, motivo: "modalidad incompatible" };

  if (a.sexo && b.sexo && a.sexo !== b.sexo) {
    return { ok: false, motivo: "sexo distinto" };
  }

  if (a.peso_pesaje == null || b.peso_pesaje == null) {
    return { ok: false, motivo: "sin peso de pesaje" };
  }

  const difPct =
    (Math.abs(a.peso_pesaje - b.peso_pesaje) /
      Math.max(a.peso_pesaje, b.peso_pesaje)) *
    100;
  if (difPct > reglas.maxDifPesoPct) return { ok: false, motivo: "diferencia de peso" };

  let score = 100 - difPct * reglas.puntosPorPctPeso;
  const criterio: string[] = [`${difPct.toFixed(1)}% de peso`];

  if (a.edad != null && b.edad != null) {
    const difEdad = Math.abs(a.edad - b.edad);
    if (difEdad > reglas.maxDifEdad) return { ok: false, motivo: "diferencia de edad" };
    score -= difEdad * reglas.puntosPorAnio;
    criterio.push(`${difEdad} año(s)`);
  } else {
    score -= reglas.penalSinEdad;
    criterio.push("edad sin registrar");
  }

  if (a.nivel !== b.nivel) {
    score -= reglas.penalNivelDistinto;
    criterio.push("nivel distinto");
  }

  return {
    ok: true,
    cruce: { a, b, score, modalidad: comunes[0], criterio: criterio.join(", ") },
  };
}

export interface ResultadoEmparejamiento {
  parejas: Cruce[];
  sinRival: Inscripcion[];
  cruceValidos: number;
  evaluados: number;
  rechazos: Record<string, number>;
}

/**
 * Empareja una lista de inscripciones.
 *
 * Estrategia: se calculan todos los cruces válidos, se ordenan por puntaje y se
 * toman de forma voraz. Con menos de ~1000 inscritos el resultado queda a un par
 * de peleas del óptimo y corre en milisegundos.
 */
export function emparejar(
  inscripciones: Inscripcion[],
  reglas: ReglasEmparejamiento = REGLAS_POR_DEFECTO
): ResultadoEmparejamiento {
  const activos = inscripciones.filter((i) => ESTADOS_EMPAREJABLES.has(i.estado));
  const cruces: Cruce[] = [];
  const rechazos: Record<string, number> = {};
  let evaluados = 0;

  for (let i = 0; i < activos.length; i++) {
    for (let j = i + 1; j < activos.length; j++) {
      evaluados++;
      const r = evaluarCruce(activos[i], activos[j], reglas);
      if (r.ok) cruces.push(r.cruce);
      else rechazos[r.motivo] = (rechazos[r.motivo] ?? 0) + 1;
    }
  }

  cruces.sort((x, y) => y.score - x.score);

  const usados = new Set<string>();
  const parejas: Cruce[] = [];
  for (const c of cruces) {
    if (usados.has(c.a.id) || usados.has(c.b.id)) continue;
    parejas.push(c);
    usados.add(c.a.id);
    usados.add(c.b.id);
  }

  return {
    parejas,
    sinRival: activos.filter((i) => !usados.has(i.id)),
    cruceValidos: cruces.length,
    evaluados,
    rechazos,
  };
}

/** Alternativas para una inscripción concreta, ordenadas de mejor a peor. */
export function alternativasPara(
  objetivo: Inscripcion,
  candidatos: Inscripcion[],
  reglas: ReglasEmparejamiento = REGLAS_POR_DEFECTO,
  limite = 10
): Cruce[] {
  return candidatos
    .filter((c) => c.id !== objetivo.id)
    .map((c) => evaluarCruce(objetivo, c, reglas))
    .flatMap((r) => (r.ok ? [r.cruce] : []))
    .sort((a, b) => b.score - a.score)
    .slice(0, limite);
}
