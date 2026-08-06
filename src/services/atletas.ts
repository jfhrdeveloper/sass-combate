import { crearClienteServidor } from "@/lib/supabase/server";
import { HAY_SUPABASE } from "@/lib/datos";

/**
 * `id` es el id de `peleador` (la fila propia de tu academia), no del
 * registro compartido `atleta` — cada academia tiene su propia fila para la
 * misma persona, con su propio récord, editable/eliminable sin afectar a
 * otras academias (ver docs/pending-task.md, sesión del 2026-08-06).
 * `atleta_id` viaja aparte, de solo uso interno (`historialVisible`,
 * `peleasEnOtrasAcademias`) — nunca se muestra en la UI.
 */
export interface ResumenAtleta {
  id: string;
  atleta_id: string | null;
  documento: string | null;
  nombres: string;
  apellidos: string;
  nacimiento: string | null;
  sexo: "M" | "F" | null;
  peleas: number;
  victorias: number;
  derrotas: number;
  empates: number;
  ultima_pelea: string | null;
  disciplinas: string[] | null;
}

export interface PeleaHistorial {
  id: string;
  fecha: string;
  evento: string;
  disciplina: string;
  modalidad: string | null;
  rival: string | null;
  club_rival: string | null;
  resultado: "victoria" | "derrota" | "empate" | "exhibicion" | "no_disputada";
  metodo: string | null;
  peso: number | null;
  externa: boolean;
}

const DEMO: ResumenAtleta[] = [
  {
    id: "a1",
    atleta_id: "atl-1",
    documento: "70123456",
    nombres: "Jamil",
    apellidos: "Zarate",
    nacimiento: "2011-03-14",
    sexo: "M",
    peleas: 8,
    victorias: 6,
    derrotas: 2,
    empates: 0,
    ultima_pelea: "2026-07-25",
    disciplinas: ["kickboxing"],
  },
  {
    id: "a2",
    atleta_id: "atl-2",
    documento: "70987654",
    nombres: "Erika",
    apellidos: "Saenz",
    nacimiento: "2004-09-02",
    sexo: "F",
    peleas: 3,
    victorias: 2,
    derrotas: 1,
    empates: 0,
    ultima_pelea: "2026-07-25",
    disciplinas: ["kickboxing"],
  },
  {
    id: "a3",
    atleta_id: "atl-3",
    documento: "71122334",
    nombres: "Santiago",
    apellidos: "Vargas",
    nacimiento: "2011-01-20",
    sexo: "M",
    peleas: 15,
    victorias: 10,
    derrotas: 4,
    empates: 1,
    ultima_pelea: "2026-07-25",
    disciplinas: ["kickboxing", "muay_thai"],
  },
  {
    id: "a4",
    atleta_id: "atl-4",
    documento: "72233445",
    nombres: "Alejandra",
    apellidos: "Nuñez",
    nacimiento: "2009-06-11",
    sexo: "F",
    peleas: 1,
    victorias: 0,
    derrotas: 1,
    empates: 0,
    ultima_pelea: "2026-03-14",
    disciplinas: ["kickboxing"],
  },
  {
    id: "a5",
    atleta_id: "atl-5",
    documento: "73344556",
    nombres: "Franchesco",
    apellidos: "Gomez",
    nacimiento: "2011-05-08",
    sexo: "M",
    peleas: 0,
    victorias: 0,
    derrotas: 0,
    empates: 0,
    ultima_pelea: null,
    disciplinas: null,
  },
  {
    id: "a6",
    atleta_id: "atl-6",
    documento: "74455667",
    nombres: "Alessandro Gianfranco",
    apellidos: "Luyo Bustamante",
    nacimiento: "2009-11-30",
    sexo: "M",
    peleas: 22,
    victorias: 19,
    derrotas: 2,
    empates: 1,
    ultima_pelea: "2026-05-10",
    disciplinas: ["kickboxing", "boxeo", "mma"],
  },
  {
    id: "a7",
    atleta_id: "atl-7",
    documento: "75566778",
    nombres: "Diego",
    apellidos: "Espinoza",
    nacimiento: "2009-02-17",
    sexo: "M",
    peleas: 5,
    victorias: 2,
    derrotas: 2,
    empates: 1,
    ultima_pelea: "2026-06-01",
    disciplinas: ["muay_thai"],
  },
  {
    id: "a8",
    atleta_id: "atl-8",
    documento: "76677889",
    nombres: "Ivana",
    apellidos: "Santamaria",
    nacimiento: "2016-08-22",
    sexo: "F",
    peleas: 2,
    victorias: 1,
    derrotas: 0,
    empates: 1,
    ultima_pelea: "2026-07-25",
    disciplinas: ["kickboxing"],
  },
];

/**
 * Una entrada por atleta (no un array plano compartido): así el historial
 * que se muestra es coherente con el récord (`peleas`/`victorias`/...) de
 * ese atleta puntual en vez de repetir las mismas 2 peleas para todos.
 */
const HISTORIAL_DEMO: Record<string, PeleaHistorial[]> = {
  a1: [
    {
      id: "h1",
      fecha: "2026-07-25",
      evento: "Contender Internacional 2026",
      disciplina: "kickboxing",
      modalidad: "low_kick",
      rival: "Santiago Vargas",
      club_rival: "La Sexta Calle",
      resultado: "victoria",
      metodo: "decision",
      peso: 57,
      externa: false,
    },
    {
      id: "h2",
      fecha: "2026-03-14",
      evento: "Copa Apertura",
      disciplina: "kickboxing",
      modalidad: "kick_light",
      rival: "Luis Paredes",
      club_rival: "Grinta Fight",
      resultado: "victoria",
      metodo: "decision",
      peso: 56.4,
      externa: true,
    },
  ],
  a2: [
    {
      id: "h3",
      fecha: "2026-07-25",
      evento: "Contender Internacional 2026",
      disciplina: "kickboxing",
      modalidad: "low_kick",
      rival: "Alejandra Nuñez",
      club_rival: "Kickboxing Espinoza",
      resultado: "victoria",
      metodo: "rsc",
      peso: 56.6,
      externa: false,
    },
    {
      id: "h4",
      fecha: "2025-11-02",
      evento: "Copa Sur",
      disciplina: "kickboxing",
      modalidad: "low_kick",
      rival: "Ana Ramirez",
      club_rival: "SKC",
      resultado: "derrota",
      metodo: "decision",
      peso: 56,
      externa: true,
    },
  ],
  a3: [
    {
      id: "h5",
      fecha: "2026-07-25",
      evento: "Contender Internacional 2026",
      disciplina: "kickboxing",
      modalidad: "low_kick",
      rival: "Jamil Zarate",
      club_rival: "Grinta Fight",
      resultado: "derrota",
      metodo: "decision",
      peso: 57,
      externa: false,
    },
    {
      id: "h6",
      fecha: "2026-04-18",
      evento: "Copa Norte",
      disciplina: "kickboxing",
      modalidad: "low_kick",
      rival: "Piero Alva",
      club_rival: "Cazorla",
      resultado: "victoria",
      metodo: "rsc",
      peso: 58,
      externa: true,
    },
    {
      id: "h7",
      fecha: "2026-01-25",
      evento: "Copa Verano",
      disciplina: "muay_thai",
      modalidad: null,
      rival: "Renato Diaz",
      club_rival: "Team Bravo Fight",
      resultado: "empate",
      metodo: "decision",
      peso: 57.5,
      externa: true,
    },
  ],
  a4: [
    {
      id: "h8",
      fecha: "2026-03-14",
      evento: "Copa Apertura",
      disciplina: "kickboxing",
      modalidad: "low_kick",
      rival: "Erika Saenz",
      club_rival: "SKC",
      resultado: "derrota",
      metodo: "decision",
      peso: 56,
      externa: true,
    },
  ],
  a5: [],
  a6: [
    {
      id: "h9",
      fecha: "2026-05-10",
      evento: "Copa Selección",
      disciplina: "kickboxing",
      modalidad: "k1",
      rival: "Bruno Salcedo",
      club_rival: "Dojo Boyka Fight",
      resultado: "victoria",
      metodo: "ko",
      peso: 70,
      externa: true,
    },
    {
      id: "h10",
      fecha: "2025-08-22",
      evento: "Nacional Elite",
      disciplina: "boxeo",
      modalidad: null,
      rival: "Carlos Peña",
      club_rival: "Zambrano Fight",
      resultado: "victoria",
      metodo: "decision",
      peso: 69.5,
      externa: true,
    },
  ],
  a7: [
    {
      id: "h11",
      fecha: "2026-06-01",
      evento: "Copa Amistad",
      disciplina: "muay_thai",
      modalidad: null,
      rival: "Yair Ostos",
      club_rival: "Cazorla",
      resultado: "derrota",
      metodo: "decision",
      peso: 55.5,
      externa: true,
    },
    {
      id: "h12",
      fecha: "2026-02-08",
      evento: "Copa Amistad",
      disciplina: "muay_thai",
      modalidad: null,
      rival: "Liam Espinoza",
      club_rival: "Team Hapa",
      resultado: "empate",
      metodo: "decision",
      peso: 55,
      externa: true,
    },
  ],
  a8: [
    {
      id: "h13",
      fecha: "2026-07-25",
      evento: "Contender Internacional 2026",
      disciplina: "kickboxing",
      modalidad: "kick_light",
      rival: "Anyelina Zevallos",
      club_rival: "Team Bravo Fight",
      resultado: "victoria",
      metodo: "decision",
      peso: 30,
      externa: false,
    },
    {
      id: "h14",
      fecha: "2026-05-15",
      evento: "Copa Infantil",
      disciplina: "kickboxing",
      modalidad: "kick_light",
      rival: "Gustavo Iriarte",
      club_rival: "La Sexta Calle",
      resultado: "empate",
      metodo: "decision",
      peso: 29.5,
      externa: true,
    },
  ],
};

/** Busca dentro de TU academia (v_mi_peleador ya está scopeado por RLS, ver migración 18). */
export async function buscarAtletas(q: string): Promise<ResumenAtleta[]> {
  if (!HAY_SUPABASE) {
    if (!q) return DEMO;
    const t = q.toLowerCase();
    return DEMO.filter(
      (a) =>
        (a.documento ?? "").includes(t) ||
        `${a.nombres} ${a.apellidos}`.toLowerCase().includes(t)
    );
  }

  if (!q) return [];

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("v_mi_peleador")
    .select("*")
    .or(`documento.ilike.%${q}%,nombres.ilike.%${q}%,apellidos.ilike.%${q}%`)
    .limit(25);

  return (data ?? []) as ResumenAtleta[];
}

export async function obtenerAtleta(id: string): Promise<ResumenAtleta | null> {
  if (!HAY_SUPABASE) return DEMO.find((a) => a.id === id) ?? DEMO[0];

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("v_mi_peleador")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return (data as ResumenAtleta | null) ?? null;
}

/** Paso "encontrado/no encontrado" al agregar: busca por documento EXACTO
 *  dentro de tu propia academia, antes de mostrar el formulario. */
export async function buscarPeleadorPorDocumento(documento: string): Promise<ResumenAtleta | null> {
  if (!HAY_SUPABASE) return DEMO.find((a) => a.documento === documento) ?? null;

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("v_mi_peleador")
    .select("*")
    .eq("documento", documento)
    .maybeSingle();

  return (data as ResumenAtleta | null) ?? null;
}

/** Cuenta (sin detalle) cuántas peleas tiene ese documento en OTRAS
 *  academias que también usan sass-combate — solo bajo demanda, nunca
 *  automático (ver `peleas_otras_academias` en la migración 18). */
export async function peleasEnOtrasAcademias(documento: string): Promise<number> {
  if (!HAY_SUPABASE) return documento === "71122334" ? 3 : 0;

  const supabase = await crearClienteServidor();
  const { data: academias } = await supabase.from("v_mis_academias").select("id").limit(1);
  const organizacionId = academias?.[0]?.id;
  if (!organizacionId) return 0;

  const { data } = await supabase.rpc("peleas_otras_academias", {
    p_documento: documento,
    p_organizacion_id: organizacionId,
  });

  return typeof data === "number" ? data : 0;
}

/** Solo devuelve las peleas que registró tu propia academia; RLS filtra el resto. */
export async function historialVisible(atletaId: string): Promise<PeleaHistorial[]> {
  if (!HAY_SUPABASE) return HISTORIAL_DEMO[atletaId] ?? [];

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("historial_pelea")
    .select("id, fecha, evento, disciplina, modalidad, rival, club_rival, resultado, metodo, peso, externa")
    .eq("atleta_id", atletaId)
    .order("fecha", { ascending: false });

  return (data ?? []) as PeleaHistorial[];
}
