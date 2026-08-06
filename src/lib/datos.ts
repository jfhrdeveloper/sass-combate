import { envPublico } from "@/config/env";
import type { Area, Bloque, CategoriaPeso, Inscripcion, ModalidadCodigo, Pelea } from "@/types";

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

/**
 * 15 eventos de ejemplo — para revisar cómo se ve el dashboard (paginado de
 * a 8, `<Paginador>`) con volumen real, no solo el único evento demo de
 * siempre. El primero sigue siendo `EVENTO_DEMO` (mismo id "demo", así que
 * todo lo que ya lee `AREAS_DEMO`/`PELEAS_DEMO`/`INSCRIPCIONES_DEMO` sigue
 * funcionando igual); los otros 14 solo tienen metadata propia — abrir
 * cualquiera de ellos muestra el mismo detalle cargado del evento "demo",
 * porque el modo demo no modela un evento por id, sino uno solo. Suficiente
 * para revisar cómo se ve la LISTA con volumen; el detalle se revisa
 * siempre entrando al primero.
 */
const NOMBRES_EVENTO = [
  "Contender Internacional 2026",
  "Copa Amanecer Kickboxing",
  "Noche de Campeones",
  "Clasificatorio Regional Norte",
  "Torneo Interclubes Lima",
  "Copa Fenix MMA",
  "Gala de Boxeo Amateur",
  "Desafío Andes Combat",
  "Copa Juvenil WAKO",
  "Torneo Apertura Muay Thai",
  "Noche de Titanes",
  "Clasificatorio Sanda Perú",
  "Copa Grappling Costa",
  "Torneo Cierre de Temporada",
  "Exhibición Selección Nacional",
];
const SEDES_EVENTO = [
  "Casa de la Cultura, San Miguel",
  "Coliseo Dibós, Lima",
  "Polideportivo Villa El Salvador",
  "Coliseo Mariscal Cáceres",
  "Complejo Deportivo Huánuco",
  "Estadio Techado Iquitos",
  "Coliseo Miguel Grau",
  "Centro de Convenciones Arequipa",
];
const ESTADOS_EVENTO = ["borrador", "inscripciones", "pesaje", "programado", "finalizado"];

/* Rango de marcas diacríticas combinantes tras NFD, construido con
   fromCharCode (no un literal `[̀-ͯ]`) — mismo motivo que en
   actions/eventos.ts: un literal así se corrompe al pasar por herramientas
   que reinterpretan el archivo como JSON. */
const RANGO_DIACRITICOS_EVENTO = new RegExp(
  String.fromCharCode(91, 0x0300) + "-" + String.fromCharCode(0x036f, 93),
  "g"
);

function aSlugEvento(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(RANGO_DIACRITICOS_EVENTO, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const EVENTOS_DEMO: Evento[] = NOMBRES_EVENTO.map((nombre, i) => {
  if (i === 0) return EVENTO_DEMO;
  const diasOffset = (i - 7) * 4; // mezcla eventos pasados y futuros alrededor de "hoy"
  const fecha = new Date(Date.now() + diasOffset * 86400000).toISOString().slice(0, 10);
  return {
    id: `demo-${i + 1}`,
    nombre,
    slug: aSlugEvento(nombre),
    fecha,
    sede: SEDES_EVENTO[i % SEDES_EVENTO.length],
    estado: ESTADOS_EVENTO[i % ESTADOS_EVENTO.length],
    plan_vence_en: null,
  };
});

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
    modalidades: ["low_kick", "k1", "boxeo"],
  },
  {
    id: "jaula",
    nombre: "Jaula",
    tipo: "jaula",
    hora_inicio: `${FECHA}T15:00:00.000Z`,
    orden: 3,
    modalidades: ["mma"],
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
  // Boxeo y MMA: prueban que la mesa muestre métodos propios de la disciplina
  // (KO/TKO en vez de RSC; sumisión/no contest en MMA) — ver METODOS_POR_DISCIPLINA.
  ["Renzo Aguilar", "Camacho Boxing", "c13", 57.0, 20, ["boxeo"]],
  ["Kevin Farfan", "Zambrano Fight", "c11", 57.8, 21, ["boxeo"]],
  ["Marco Villalta", "Team Hapa", "c5", 70.0, 24, ["mma"]],
  ["Ruben Castillo", "Dojo Boyka Fight", "c7", 70.5, 23, ["mma"]],
];

const INSCRIPCIONES_CURADAS: Inscripcion[] = CRUDOS.map(
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

/**
 * Generador de volumen — para revisar cómo se ve el sistema con muchos
 * peleadores/peleas/pagos, no solo el puñado curado de arriba. Determinista
 * (PRNG con semilla fija, no `Math.random()`) para que las capturas sean
 * reproducibles entre reinicios del servidor.
 */
function mulberry32(semilla: number) {
  let a = semilla;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOMBRES_GEN = [
  "Mateo", "Valentina", "Sebastian", "Camila", "Nicolas", "Sofia", "Diego", "Isabella",
  "Gabriel", "Luciana", "Adrian", "Renata", "Fabian", "Antonella", "Joaquin", "Mia",
  "Rodrigo", "Fernanda", "Emilio", "Daniela", "Ismael", "Paula", "Leonardo", "Ariana",
  "Cristian", "Milagros", "Andres", "Ximena", "Julian", "Abril",
];
const APELLIDOS_GEN = [
  "Quispe", "Mamani", "Flores", "Huaman", "Rojas", "Chavez", "Torres", "Vega",
  "Ramos", "Salazar", "Cardenas", "Pinedo", "Delgado", "Cuba", "Bardales", "Reategui",
  "Panduro", "Sifuentes", "Ipanaque", "Chumpitaz", "Bazan", "Guevara", "Rimac", "Ochoa",
];
const CLUBES_GEN = [
  "Fenix Combat", "Warrior's Den", "Selva Fight Team", "Norte Kickboxing",
  "Andes MMA", "Puma Gym", "Halcones del Ring", "Sparta Boxing Club",
  "Titan Fight House", "Guerreros del Sur", "Pacifico Combat", "Leon Dorado",
];

const MODALIDADES_TODAS: ModalidadCodigo[] = [
  "low_kick", "k1", "full_contact", "kick_light", "light_contact", "point_fighting",
  "boxeo", "muay_thai", "mma", "sanda", "gi", "no_gi",
];
const RANGO_PESO_GEN: Record<ModalidadCodigo, [number, number]> = {
  low_kick: [50, 85],
  k1: [55, 90],
  full_contact: [55, 90],
  kick_light: [35, 65],
  light_contact: [35, 65],
  point_fighting: [35, 65],
  boxeo: [50, 85],
  muay_thai: [55, 90],
  mma: [60, 95],
  sanda: [55, 85],
  gi: [55, 90],
  no_gi: [55, 90],
};
const POR_MODALIDAD_GEN = 10; // peleadores generados por modalidad (10 × 12 = 120 extra)

const rand = mulberry32(20260804);

const INSCRIPCIONES_GENERADAS: Inscripcion[] = MODALIDADES_TODAS.flatMap((modalidad) => {
  const [min, max] = RANGO_PESO_GEN[modalidad];
  return Array.from({ length: POR_MODALIDAD_GEN }, () => {
    const clubIdx = Math.floor(rand() * CLUBES_GEN.length);
    return {
      nombre: `${NOMBRES_GEN[Math.floor(rand() * NOMBRES_GEN.length)]} ${APELLIDOS_GEN[Math.floor(rand() * APELLIDOS_GEN.length)]}`,
      club: CLUBES_GEN[clubIdx],
      club_id: `cg${clubIdx + 1}`,
      peso: Math.round((min + rand() * (max - min)) * 10) / 10,
      edad: 15 + Math.floor(rand() * 20),
      modalidad,
    };
  });
}).map((g, i) => {
  const n = INSCRIPCIONES_CURADAS.length + i;
  return {
    id: `ins-${n + 1}`,
    peleador_id: `pel-${n + 1}`,
    nombre: g.nombre,
    club: g.club,
    club_id: g.club_id,
    sexo: n % 2 === 0 ? "M" : "F",
    edad: g.edad,
    peso_pesaje: g.peso,
    modalidades: [g.modalidad],
    clase: (["A", "B", "C"] as const)[n % 3],
    nivel: (["debutante", "novel_1", "novel_2", "intermedio", "avanzado"] as const)[n % 5],
    estado: "pesada",
  };
});

export const INSCRIPCIONES_DEMO: Inscripcion[] = [...INSCRIPCIONES_CURADAS, ...INSCRIPCIONES_GENERADAS];

const AREA_POR_MODALIDAD_GEN: Record<ModalidadCodigo, string> = {
  low_kick: "ring", k1: "ring", full_contact: "ring", boxeo: "ring", muay_thai: "ring", sanda: "ring",
  kick_light: "tatami-1", light_contact: "tatami-1", point_fighting: "tatami-1", gi: "tatami-1", no_gi: "tatami-1",
  mma: "jaula",
};

type TuplaPelea = [string, number, string, string, number, Pelea["estado"], number | null, number | null];

const PELEAS_CURADAS: TuplaPelea[] = [
  ["tatami-1", 1, "ins-11", "ins-12", 60, "finalizada", 0, 8],
  ["tatami-1", 2, "ins-15", "ins-16", 60, "finalizada", 8, 19],
  ["tatami-1", 3, "ins-17", "ins-18", 60, "en_curso", 19, null],
  ["tatami-1", 4, "ins-13", "ins-14", 120, "lista", null, null],
  ["tatami-1", 5, "ins-19", "ins-20", 120, "pendiente", null, null],
  // Boxeo va primera en el ring (orden 1): así aparece dentro de las
  // "próximas 8" de la mesa sin tener que resolver antes las de kickboxing.
  ["ring", 1, "ins-21", "ins-22", 180, "pendiente", null, null],
  ["ring", 2, "ins-1", "ins-2", 120, "pendiente", null, null],
  ["ring", 3, "ins-3", "ins-4", 120, "pendiente", null, null],
  ["ring", 4, "ins-5", "ins-6", 120, "pendiente", null, null],
  ["ring", 5, "ins-7", "ins-8", 120, "pendiente", null, null],
  ["ring", 6, "ins-9", "ins-10", 120, "pendiente", null, null],
  ["jaula", 1, "ins-23", "ins-24", 300, "pendiente", null, null],
];

/** Empareja a los generados por peso dentro de su propia modalidad (pares
 *  consecutivos, ya ordenados) — mismo criterio que usaría el emparejador,
 *  sin depender de él. `POR_MODALIDAD_GEN` es par, así que no queda nadie
 *  sin rival acá (los "sin rival" reales siguen viniendo del emparejador). */
const ordenPorArea: Record<string, number> = { "tatami-1": 5, ring: 6, jaula: 1 };
const PELEAS_GENERADAS: TuplaPelea[] = MODALIDADES_TODAS.flatMap((modalidad) => {
  const grupo = INSCRIPCIONES_GENERADAS.filter((i) => i.modalidades[0] === modalidad).sort(
    (a, b) => (a.peso_pesaje ?? 0) - (b.peso_pesaje ?? 0)
  );
  const area = AREA_POR_MODALIDAD_GEN[modalidad];
  const tuplas: TuplaPelea[] = [];
  for (let k = 0; k + 1 < grupo.length; k += 2) {
    ordenPorArea[area] += 1;
    tuplas.push([area, ordenPorArea[area], grupo[k].id, grupo[k + 1].id, 120, "pendiente", null, null]);
  }
  return tuplas;
});

export const PELEAS_DEMO: Pelea[] = [...PELEAS_CURADAS, ...PELEAS_GENERADAS].map((f) => {
  const [areaId, orden, roja, azul, dur, estado, iniMin, finMin] = f;
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

/**
 * Categorías de peso de ejemplo del evento demo — cubre a los boxeadores
 * (Renzo/Kevin, ~57kg → "Peso pluma") y a parte de los peleadores de low_kick
 * ya existentes, para que el chip de categoría se vea sin necesitar un
 * evento real con categorías cargadas por el organizador.
 */
export const CATEGORIAS_DEMO: CategoriaPeso[] = [
  { id: "cat-pluma-box", nombre: "Peso pluma", sexo: null, peso_min: 55, peso_max: 60, modalidad: "boxeo" },
  { id: "cat-welter-box", nombre: "Peso welter", sexo: null, peso_min: 63.5, peso_max: 67, modalidad: "boxeo" },
  { id: "cat-lk-57", nombre: "-57kg", sexo: null, peso_min: 55, peso_max: 57, modalidad: "low_kick" },
  { id: "cat-lk-63", nombre: "-63kg", sexo: null, peso_min: 60, peso_max: 63, modalidad: "low_kick" },
  { id: "cat-lk-71", nombre: "-71kg", sexo: null, peso_min: 67, peso_max: 71, modalidad: "low_kick" },
];
