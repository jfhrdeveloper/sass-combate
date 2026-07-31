import { envPublico } from "@/config/env";
import type { Area, Bloque, Inscripcion, Pelea } from "@/types";

export const HAY_SUPABASE = Boolean(
  envPublico.NEXT_PUBLIC_SUPABASE_URL && envPublico.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export interface Evento {
  id: string;
  nombre: string;
  slug: string;
  fecha: string;
  sede: string | null;
  estado: string;
  plan_vence_en: string | null;
}

/**
 * Se calcula al cargar el módulo (no un literal fijo): un evento demo con
 * fecha estática se queda "atrasado" apenas pasan los días — el cálculo de
 * retraso en tiempo real (`horarios.ts`) lo compara contra `new Date()` y
 * termina mostrando disparates como "125 h de retraso". Así el evento demo
 * siempre pasa "hoy".
 */
const FECHA = new Date().toISOString().slice(0, 10);

export const EVENTO_DEMO: Evento = {
  id: "demo",
  nombre: "Contender Internacional 2026",
  slug: "contender-2026",
  fecha: FECHA,
  sede: "Casa de la Cultura, San Miguel",
  estado: "en_curso",
  plan_vence_en: null,
};

export const AREAS_DEMO: Area[] = [
  {
    id: "tatami-1",
    nombre: "Tatami 1",
    tipo: "tatami",
    hora_inicio: `${FECHA}T14:00:00.000Z`,
    orden: 1,
    modalidades: ["kick_light", "light_contact", "point_fighting"],
  },
  {
    id: "ring",
    nombre: "Ring",
    tipo: "ring",
    hora_inicio: `${FECHA}T16:00:00.000Z`,
    orden: 2,
    modalidades: ["low_kick", "k1"],
  },
];

const CRUDOS: Array<[string, string, string, number, number | null, Inscripcion["modalidades"]]> = [
  ["Santiago Vargas", "La Sexta Calle", "c1", 57.0, 15, ["low_kick"]],
  ["Jamil Zarate", "Grinta Fight", "c2", 57.0, 15, ["low_kick"]],
  ["Eyal Gonzales", "Diamond Boys", "c3", 57.0, 16, ["low_kick"]],
  ["Franchesco Gomez", "Federico Gomez Iquitos", "c4", 57.5, 15, ["low_kick"]],
  ["Jhon Montalvan", "Federico Gomez Iquitos", "c4", 55.4, 17, ["low_kick"]],
  ["Diego Espinoza", "Team Hapa", "c5", 55.6, 17, ["low_kick"]],
  ["Yair Ostos", "Cazorla", "c6", 69.7, 17, ["low_kick"]],
  ["Alessandro Luyo", "Dojo Boyka Fight", "c7", 70.0, 17, ["low_kick"]],
  ["Erika Saenz", "SKC", "c8", 56.6, null, ["low_kick"]],
  ["Alejandra Nuñez", "Kickboxing Espinoza", "c9", 56.95, null, ["low_kick"]],
  ["Yunuel Vasquez", "La Sexta Calle", "c1", 29.0, 9, ["kick_light"]],
  ["Liam Espinoza", "Team Hapa", "c5", 29.5, 9, ["kick_light"]],
  ["Raid Marin", "Team Bravo Fight", "c10", 45.0, 12, ["kick_light"]],
  ["Samin Cazorla", "Cazorla", "c6", 47.0, 11, ["kick_light"]],
  ["Gustavo Iriarte", "La Sexta Calle", "c1", 30.0, 9, ["kick_light"]],
  ["Henry Ramos", "Team Bravo Fight", "c10", 32.0, 8, ["kick_light"]],
  ["Ivana Santamaria", "La Sexta Calle", "c1", 30.0, 8, ["kick_light"]],
  ["Anyelina Zevallos", "Team Bravo Fight", "c10", 33.0, 8, ["kick_light"]],
  ["Brayan Valdivia", "Zambrano Fight", "c11", 68.25, 17, ["light_contact"]],
  ["Thiago Villa", "Kick Fighters Nasca", "c12", 69.0, 15, ["light_contact"]],
];

export const INSCRIPCIONES_DEMO: Inscripcion[] = CRUDOS.map(
  ([nombre, club, clubId, peso, edad, modalidades], i) => ({
    id: `ins-${i + 1}`,
    peleador_id: `pel-${i + 1}`,
    nombre,
    club,
    club_id: clubId,
    sexo: null,
    edad,
    peso_pesaje: peso,
    modalidades,
    clase: i % 3 === 0 ? "A" : "B",
    nivel: i % 5 === 0 ? "novel_1" : "debutante",
    estado: "pesada",
  })
);

export const PELEAS_DEMO: Pelea[] = [
  ["tatami-1", 1, "ins-11", "ins-12", 60, "finalizada", 0, 8],
  ["tatami-1", 2, "ins-15", "ins-16", 60, "finalizada", 8, 19],
  ["tatami-1", 3, "ins-17", "ins-18", 60, "en_curso", 19, null],
  ["tatami-1", 4, "ins-13", "ins-14", 120, "lista", null, null],
  ["tatami-1", 5, "ins-19", "ins-20", 120, "pendiente", null, null],
  ["ring", 1, "ins-1", "ins-2", 120, "pendiente", null, null],
  ["ring", 2, "ins-3", "ins-4", 120, "pendiente", null, null],
  ["ring", 3, "ins-5", "ins-6", 120, "pendiente", null, null],
  ["ring", 4, "ins-7", "ins-8", 120, "pendiente", null, null],
  ["ring", 5, "ins-9", "ins-10", 120, "pendiente", null, null],
].map((f) => {
  const [areaId, orden, roja, azul, dur, estado, iniMin, finMin] = f as [
    string,
    number,
    string,
    string,
    number,
    Pelea["estado"],
    number | null,
    number | null,
  ];
  const base = new Date(AREAS_DEMO.find((a) => a.id === areaId)!.hora_inicio).getTime();
  return {
    id: `pel-${areaId}-${orden}`,
    area_id: areaId,
    orden,
    roja_id: roja,
    azul_id: azul,
    rounds: 3,
    duracion_round_seg: dur,
    descanso_seg: 60,
    estado,
    hora_estimada: null,
    hora_inicio_real: iniMin == null ? null : new Date(base + iniMin * 60000).toISOString(),
    hora_fin_real: finMin == null ? null : new Date(base + finMin * 60000).toISOString(),
  };
});

export const BLOQUES_DEMO: Bloque[] = [
  {
    id: "b1",
    area_id: "tatami-1",
    nombre: "Break",
    duracion_seg: 1800,
    despues_de_orden: 3,
  },
];

export function inscripcionPorId(id: string | null): Inscripcion | undefined {
  return id ? INSCRIPCIONES_DEMO.find((i) => i.id === id) : undefined;
}
