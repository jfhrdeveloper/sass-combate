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
  | "full_contact"
  | "kick_light"
  | "light_contact"
  | "point_fighting"
  | "boxeo"
  | "muay_thai"
  | "mma"
  | "sanda"
  | "gi"
  | "no_gi";

/** Disciplina "madre" de cada modalidad — una modalidad es la variante de reglas
 *  concreta (ej. "Low Kick" es kickboxing con patadas bajas permitidas); la
 *  disciplina es la familia que determina qué métodos de victoria aplican
 *  (ver `METODOS_POR_DISCIPLINA`) y en qué tipo de área se pelea. */
export type Disciplina = "kickboxing" | "boxeo" | "muay thai" | "mma" | "sanda" | "jiu-jitsu";

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
  /** Eliminación directa (MMA), a diferencia de 'pactado' (el resto de disciplinas
   *  vía el emparejador). `llave_id`/`ronda`/`posicion` solo aplican cuando es 'bracket'. */
  tipo?: "pactado" | "bracket";
  llave_id?: string | null;
  ronda?: number | null;
  posicion?: number | null;
}

export interface Bloque {
  id: string;
  area_id: string | null;
  nombre: string;
  duracion_seg: number;
  despues_de_orden: number;
}

/** Modalidades que se pelean en cada tipo de área — espejo de la columna
 *  `tipo_area` del catálogo `modalidad` en `supabase/migrations/20260101000004_historial_y_plataforma.sql`. */
export const MODALIDADES_POR_AREA: Record<TipoArea, ModalidadCodigo[]> = {
  ring: ["low_kick", "k1", "full_contact", "boxeo", "muay_thai", "sanda"],
  tatami: ["kick_light", "light_contact", "point_fighting", "gi", "no_gi"],
  jaula: ["mma"],
};

export const NOMBRE_MODALIDAD: Record<ModalidadCodigo, string> = {
  low_kick: "Low Kick",
  k1: "K1",
  full_contact: "Full Contact",
  kick_light: "Kick Light",
  light_contact: "Light Contact",
  point_fighting: "Point Fighting",
  boxeo: "Boxeo",
  muay_thai: "Muay Thai",
  mma: "MMA",
  sanda: "Sanda",
  gi: "Gi",
  no_gi: "No Gi",
};

/** Espejo de la columna `disciplina` del catálogo `modalidad` en la migración
 *  de plataforma — determina qué lista de `METODOS_POR_DISCIPLINA` usa la mesa
 *  de control al registrar un resultado. */
export const DISCIPLINA_POR_MODALIDAD: Record<ModalidadCodigo, Disciplina> = {
  low_kick: "kickboxing",
  k1: "kickboxing",
  full_contact: "kickboxing",
  kick_light: "kickboxing",
  light_contact: "kickboxing",
  point_fighting: "kickboxing",
  boxeo: "boxeo",
  muay_thai: "muay thai",
  mma: "mma",
  sanda: "sanda",
  gi: "jiu-jitsu",
  no_gi: "jiu-jitsu",
};

/** Métodos de victoria válidos en `resultado.metodo` (columna `text` libre en
 *  la base — este union es solo la capa de UI/validación del lado app). */
export type MetodoCodigo =
  | "decision"
  | "ko"
  | "tko"
  | "rsc"
  | "sumision"
  | "puntos"
  | "ventaja"
  | "ring_out"
  | "abandono"
  | "descalificacion"
  | "walkover"
  | "no_contest";

export const NOMBRE_METODO: Record<MetodoCodigo, string> = {
  decision: "Decisión",
  ko: "KO",
  tko: "TKO",
  rsc: "RSC",
  sumision: "Sumisión",
  puntos: "Puntos",
  ventaja: "Ventaja",
  ring_out: "Salida del área",
  abandono: "Abandono",
  descalificacion: "Descalificación",
  walkover: "Walkover",
  no_contest: "No contest",
};

/** Cada disciplina tiene su propio vocabulario de victoria — kickboxing WAKO
 *  no usa "KO"/"TKO" (usa RSC), jiu-jitsu no tiene decisión por jueces en el
 *  mismo sentido (sumisión/puntos/ventaja), MMA agrega "no contest", sanda
 *  agrega la salida del área como método propio. */
export const METODOS_POR_DISCIPLINA: Record<Disciplina, MetodoCodigo[]> = {
  kickboxing: ["decision", "rsc", "abandono", "descalificacion", "walkover"],
  boxeo: ["decision", "ko", "tko", "abandono", "descalificacion", "walkover"],
  "muay thai": ["decision", "ko", "tko", "abandono", "descalificacion", "walkover"],
  mma: ["decision", "ko", "tko", "sumision", "descalificacion", "no_contest"],
  sanda: ["decision", "ko", "tko", "ring_out", "abandono", "descalificacion"],
  "jiu-jitsu": ["sumision", "puntos", "ventaja", "descalificacion", "walkover"],
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

/**
 * Categoría de peso con nombre ("Peso pluma"), definida por el organizador
 * para SU evento (tabla `categoria`, ya existe en el schema desde el primer
 * commit — ver `supabase/migrations/20260101000001_esquema.sql`). Es solo
 * una etiqueta: `peso_min === peso_max` la vuelve un peso exacto, distintos
 * la vuelven un rango. **No** participa del emparejador (`src/lib/emparejador.ts`),
 * que sigue matcheando por tolerancia porcentual — decisión explícita para no
 * tocar esa lógica ni sus pruebas.
 */
export interface CategoriaPeso {
  id: string;
  nombre: string;
  sexo: Sexo | null;
  peso_min: number | null;
  peso_max: number | null;
  /** A qué modalidad pertenece (`categoria.modalidad_id` en la base, resuelto
   *  acá al código en vez del uuid — mismo patrón simplificado que ya usa
   *  `Inscripcion.modalidades` en modo demo). Filtrar por esto ANTES de llamar
   *  a `categoriaDePeso`: la función en sí no conoce modalidades. */
  modalidad: ModalidadCodigo;
}
