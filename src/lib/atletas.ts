import { crearClienteServidor } from "./supabase/server";
import { HAY_SUPABASE } from "./datos";

export interface ResumenAtleta {
  id: string;
  documento: string;
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
];

const HISTORIAL_DEMO: PeleaHistorial[] = [
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
];

export async function buscarAtletas(q: string): Promise<ResumenAtleta[]> {
  if (!HAY_SUPABASE) {
    if (!q) return DEMO;
    const t = q.toLowerCase();
    return DEMO.filter(
      (a) =>
        a.documento.includes(t) ||
        `${a.nombres} ${a.apellidos}`.toLowerCase().includes(t)
    );
  }

  if (!q) return [];

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("v_resumen_atleta")
    .select("*")
    .or(`documento.ilike.%${q}%,nombres.ilike.%${q}%,apellidos.ilike.%${q}%`)
    .limit(25);

  return (data ?? []) as ResumenAtleta[];
}

export async function obtenerAtleta(id: string): Promise<ResumenAtleta | null> {
  if (!HAY_SUPABASE) return DEMO.find((a) => a.id === id) ?? DEMO[0];

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("v_resumen_atleta")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return (data as ResumenAtleta | null) ?? null;
}

/** Solo devuelve las peleas que registró tu propia academia; RLS filtra el resto. */
export async function historialVisible(atletaId: string): Promise<PeleaHistorial[]> {
  if (!HAY_SUPABASE) return HISTORIAL_DEMO;

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("historial_pelea")
    .select("id, fecha, evento, disciplina, modalidad, rival, club_rival, resultado, metodo, peso, externa")
    .eq("atleta_id", atletaId)
    .order("fecha", { ascending: false });

  return (data ?? []) as PeleaHistorial[];
}
