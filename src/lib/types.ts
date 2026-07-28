export type Sexo = "M" | "F";
export type Clase = "A" | "B" | "C";
export type Esquina = "roja" | "azul";

export type Nivel =
  | "debutante"
  | "novel_1"
  | "novel_2"
  | "intermedio"
  | "avanzado"
  | "seleccion";

export type ModalidadCodigo =
  | "low_kick"
  | "k1"
  | "kick_light"
  | "light_contact"
  | "point_fighting";

export type TipoArea = "ring" | "tatami" | "jaula";

export type EstadoPelea =
  | "pendiente"
  | "lista"
  | "en_curso"
  | "finalizada"
  | "cancelada";

export type EstadoInscripcion =
  | "pendiente"
  | "pagada"
  | "pesada"
  | "aprobada"
  | "sin_rival"
  | "retirada"
  | "ausente";

export interface Club {
  id: string;
  nombre: string;
}

export interface Peleador {
  id: string;
  nombres: string;
  apellidos: string;
  club_id: string | null;
  nacimiento: string | null;
  sexo: Sexo | null;
}

/** Un peleador ya inscrito en un evento, tal como lo ve el emparejador. */
export interface Inscripcion {
  id: string;
  peleador_id: string;
  nombre: string;
  club_id: string | null;
  club: string;
  sexo: Sexo | null;
  edad: number | null;
  peso_pesaje: number | null;
  modalidades: ModalidadCodigo[];
  clase: Clase | null;
  nivel: Nivel;
  estado: EstadoInscripcion;
}

export interface Area {
  id: string;
  nombre: string;
  tipo: TipoArea;
  hora_inicio: string;
  orden: number;
  modalidades: ModalidadCodigo[];
}

export interface Pelea {
  id: string;
  area_id: string | null;
  orden: number | null;
  roja_id: string | null;
  azul_id: string | null;
  rounds: number;
  duracion_round_seg: number;
  descanso_seg: number;
  estado: EstadoPelea;
  hora_estimada: string | null;
  hora_inicio_real: string | null;
  hora_fin_real: string | null;
}

export interface Bloque {
  id: string;
  area_id: string | null;
  nombre: string;
  duracion_seg: number;
  despues_de_orden: number;
}

/** Modalidades que se pelean en cada tipo de área. */
export const MODALIDADES_POR_AREA: Record<TipoArea, ModalidadCodigo[]> = {
  ring: ["low_kick", "k1"],
  tatami: ["kick_light", "light_contact", "point_fighting"],
  jaula: [],
};

export const NOMBRE_MODALIDAD: Record<ModalidadCodigo, string> = {
  low_kick: "Low Kick",
  k1: "K1",
  kick_light: "Kick Light",
  light_contact: "Light Contact",
  point_fighting: "Point Fighting",
};

/** Rounds, duración de round y descanso según la clase, en segundos. */
export const FORMATO_POR_CLASE: Record<Clase, [number, number, number]> = {
  A: [3, 120, 60],
  B: [3, 60, 60],
  C: [3, 60, 60],
};

/** Formato reducido para las categorías infantiles según las bases WAKO. */
export function formatoPorEdadYClase(
  edad: number | null,
  clase: Clase | null
): [number, number, number] {
  if (edad !== null && edad <= 9) return [2, 60, 60];
  if (edad !== null && edad <= 12) return [2, 120, 60];
  return FORMATO_POR_CLASE[clase ?? "B"];
}

/** Segundos de reloj de una pelea, incluidos entrada, salida y decisión. */
export const SEGUNDOS_PROTOCOLO = 180;

export function duracionPelea(
  rounds: number,
  duracionRound: number,
  descanso: number
): number {
  return rounds * duracionRound + (rounds - 1) * descanso + SEGUNDOS_PROTOCOLO;
}
