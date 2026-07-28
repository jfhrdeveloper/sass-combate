import { redirect } from "next/navigation";
import { crearClienteServidor } from "./supabase/server";
import { HAY_SUPABASE } from "./datos";

export interface ResumenAcademia {
  id: string;
  nombre: string;
  slug: string;
  plan: string;
  creado_en: string;
  miembros: number;
  eventos: number;
  inscripciones: number;
  ultimo_evento: string | null;
}

export interface Academia {
  id: string;
  nombre: string;
  slug: string;
  plan: string;
  rol: "dueno" | "admin" | "mesa" | "coach" | "juez" | "lector";
}

export interface Sesion {
  usuarioId: string;
  email: string;
  nombre: string | null;
}

export const ACADEMIA_DEMO: Academia = {
  id: "demo",
  nombre: "Academia demo",
  slug: "demo",
  plan: "free",
  rol: "dueno",
};

export const SESION_DEMO: Sesion = {
  usuarioId: "demo",
  email: "demo@ejemplo.com",
  nombre: "Modo demo",
};

export async function sesionActual(): Promise<Sesion | null> {
  if (!HAY_SUPABASE) return SESION_DEMO;
  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return {
    usuarioId: data.user.id,
    email: data.user.email ?? "",
    nombre:
      (data.user.user_metadata?.full_name as string | undefined) ??
      (data.user.user_metadata?.name as string | undefined) ??
      null,
  };
}

export async function misAcademias(): Promise<Academia[]> {
  if (!HAY_SUPABASE) return [ACADEMIA_DEMO];
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("v_mis_academias").select("*");
  return (data ?? []) as Academia[];
}

/**
 * Exige sesión y al menos una academia. Si falta cualquiera de las dos,
 * manda al usuario donde corresponde.
 *
 * Esto es comodidad de navegación, no seguridad: quien impide leer datos
 * ajenos es RLS en Postgres, no este redirect.
 */
export async function exigirAcademia(): Promise<{ sesion: Sesion; academia: Academia }> {
  const sesion = await sesionActual();
  if (!sesion) redirect("/entrar");

  const academias = await misAcademias();
  if (academias.length === 0) redirect("/nueva-academia");

  return { sesion, academia: academias[0] };
}

/** ¿El usuario pertenece al equipo del SaaS, no al de una academia? */
export async function esStaff(): Promise<boolean> {
  if (!HAY_SUPABASE) return true;
  const supabase = await crearClienteServidor();
  const { data } = await supabase.rpc("es_staff");
  return data === true;
}

export async function academiasDePlataforma(): Promise<ResumenAcademia[]> {
  if (!HAY_SUPABASE) {
    return [
      {
        id: "demo",
        nombre: "Academia demo",
        slug: "demo",
        plan: "free",
        creado_en: new Date().toISOString(),
        miembros: 3,
        eventos: 1,
        inscripciones: 154,
        ultimo_evento: "2026-07-25",
      },
    ];
  }
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("v_academias_plataforma")
    .select("*")
    .order("creado_en", { ascending: false });
  return (data ?? []) as ResumenAcademia[];
}

const JERARQUIA: Record<Academia["rol"], number> = {
  dueno: 6,
  admin: 5,
  mesa: 4,
  coach: 3,
  juez: 2,
  lector: 1,
};

export function puede(rol: Academia["rol"], minimo: Academia["rol"]): boolean {
  return JERARQUIA[rol] >= JERARQUIA[minimo];
}
