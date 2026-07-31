import { crearClienteServidor } from "./supabase/server";
import { HAY_SUPABASE } from "./datos";

export interface Reclamo {
  id: string;
  numero: number;
  tipo: "reclamo" | "queja";
  consumidor_nombre: string;
  documento_tipo: "dni" | "ce" | "pasaporte";
  documento_numero: string;
  consumidor_domicilio: string;
  consumidor_telefono: string | null;
  consumidor_correo: string;
  es_menor_edad: boolean;
  tutor_nombre: string | null;
  bien_o_servicio: string;
  monto_reclamado: number | null;
  detalle: string;
  pedido: string;
  estado: "pendiente" | "respondido";
  respuesta: string | null;
  respondido_en: string | null;
  creado_en: string;
}

export interface NuevoReclamo {
  tipo: Reclamo["tipo"];
  consumidor_nombre: string;
  documento_tipo: Reclamo["documento_tipo"];
  documento_numero: string;
  consumidor_domicilio: string;
  consumidor_telefono?: string;
  consumidor_correo: string;
  es_menor_edad: boolean;
  tutor_nombre?: string;
  bien_o_servicio: string;
  monto_reclamado?: number;
  detalle: string;
  pedido: string;
}

const DEMO: Reclamo[] = [
  {
    id: "rc1",
    numero: 1,
    tipo: "reclamo",
    consumidor_nombre: "Ejemplo Demo",
    documento_tipo: "dni",
    documento_numero: "00000000",
    consumidor_domicilio: "Av. Ejemplo 123, Lima",
    consumidor_telefono: "900000000",
    consumidor_correo: "demo@ejemplo.com",
    es_menor_edad: false,
    tutor_nombre: null,
    bien_o_servicio: "Plan Por evento",
    monto_reclamado: 149,
    detalle: "Reclamo de ejemplo para mostrar cómo se ve esta vista en modo demo.",
    pedido: "Que se explique el estado del reclamo.",
    estado: "pendiente",
    respuesta: null,
    respondido_en: null,
    creado_en: new Date().toISOString(),
  },
];

/**
 * Público: cualquiera puede presentar un reclamo, con o sin sesión — RLS lo
 * permite a propósito (`reclamo_creacion`). En modo demo no hay dónde
 * guardarlo, así que se avisa en vez de simular un número de reclamo real.
 */
export async function crearReclamo(
  datos: NuevoReclamo
): Promise<{ ok: true; numero: number | null } | { ok: false; error: string }> {
  if (!HAY_SUPABASE) return { ok: true, numero: null };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("reclamo").insert(datos).select("numero").single();

  if (error || !data) {
    return {
      ok: false,
      error: "No se pudo registrar el reclamo. Intenta de nuevo o escríbenos directamente.",
    };
  }
  return { ok: true, numero: data.numero };
}

/** Solo para /admin/reclamos — RLS ya exige es_staff() para leer. */
export async function listarReclamos(): Promise<Reclamo[]> {
  if (!HAY_SUPABASE) return DEMO;

  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("reclamo").select("*").order("creado_en", { ascending: false });
  return (data ?? []) as Reclamo[];
}

export async function responderReclamo(id: string, respuesta: string): Promise<{ ok: boolean }> {
  if (!HAY_SUPABASE) return { ok: true };

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("reclamo")
    .update({
      estado: "respondido",
      respuesta,
      respondido_por: user?.id ?? null,
      respondido_en: new Date().toISOString(),
    })
    .eq("id", id);

  return { ok: !error };
}
