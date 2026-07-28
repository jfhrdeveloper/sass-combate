import { addSeconds, differenceInSeconds } from "date-fns";
import type { Area, Bloque, Pelea } from "./types";
import { duracionPelea } from "./types";

export interface FilaAgenda {
  tipo: "pelea" | "bloque";
  id: string;
  areaId: string;
  orden: number;
  nombre: string;
  inicio: Date;
  fin: Date;
  duracionSeg: number;
  real: boolean;
  estado?: Pelea["estado"];
}

export interface AgendaArea {
  area: Area;
  filas: FilaAgenda[];
  finEstimado: Date;
  retrasoSeg: number;
}

/**
 * Reconstruye el horario de cada área.
 *
 * Regla central: las horas nunca se guardan a mano. Se parte de la hora de
 * inicio del área y se van sumando duraciones. Cuando una pelea ya terminó, su
 * hora real manda y todo lo que viene detrás se recorre.
 */
export function construirAgenda(
  areas: Area[],
  peleas: Pelea[],
  bloques: Bloque[],
  ahora: Date = new Date()
): AgendaArea[] {
  return [...areas]
    .sort((a, b) => a.orden - b.orden)
    .map((area) => {
      const propias = peleas
        .filter((p) => p.area_id === area.id)
        .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

      let reloj = new Date(area.hora_inicio);
      let retrasoSeg = 0;
      const filas: FilaAgenda[] = [];

      for (const p of propias) {
        const dur = duracionPelea(p.rounds, p.duracion_round_seg, p.descanso_seg);

        if (p.hora_inicio_real) {
          const inicioReal = new Date(p.hora_inicio_real);
          retrasoSeg = differenceInSeconds(inicioReal, reloj);
          reloj = inicioReal;
        }

        const inicio = reloj;
        const fin = p.hora_fin_real ? new Date(p.hora_fin_real) : addSeconds(inicio, dur);

        filas.push({
          tipo: "pelea",
          id: p.id,
          areaId: area.id,
          orden: p.orden ?? 0,
          nombre: `Pelea ${p.orden ?? 0}`,
          inicio,
          fin,
          duracionSeg: dur,
          real: Boolean(p.hora_fin_real),
          estado: p.estado,
        });

        reloj = fin;

        for (const b of bloques.filter(
          (b) => b.area_id === area.id && b.despues_de_orden === (p.orden ?? 0)
        )) {
          const finBloque = addSeconds(reloj, b.duracion_seg);
          filas.push({
            tipo: "bloque",
            id: b.id,
            areaId: area.id,
            orden: p.orden ?? 0,
            nombre: b.nombre,
            inicio: reloj,
            fin: finBloque,
            duracionSeg: b.duracion_seg,
            real: false,
          });
          reloj = finBloque;
        }
      }

      if (retrasoSeg === 0) {
        const siguiente = filas.find((f) => f.tipo === "pelea" && f.estado !== "finalizada");
        if (siguiente && ahora > siguiente.inicio) {
          retrasoSeg = differenceInSeconds(ahora, siguiente.inicio);
        }
      }

      return { area, filas, finEstimado: reloj, retrasoSeg };
    });
}

/** Peleas que vienen a continuación en todas las áreas, ordenadas por hora. */
export function proximasPeleas(agendas: AgendaArea[], cuantas = 5): FilaAgenda[] {
  return agendas
    .flatMap((a) => a.filas)
    .filter((f) => f.tipo === "pelea" && f.estado !== "finalizada" && f.estado !== "cancelada")
    .sort((a, b) => a.inicio.getTime() - b.inicio.getTime())
    .slice(0, cuantas);
}

export function formatearRetraso(segundos: number): string {
  if (Math.abs(segundos) < 120) return "en hora";
  const min = Math.round(Math.abs(segundos) / 60);
  const texto = min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`;
  return segundos > 0 ? `${texto} de retraso` : `${texto} adelantado`;
}
