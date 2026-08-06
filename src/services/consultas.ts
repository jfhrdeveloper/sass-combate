import { crearClienteServidor } from "@/lib/supabase/server";
import {
  AREAS_DEMO,
  BLOQUES_DEMO,
  CATEGORIAS_DEMO,
  EVENTO_DEMO,
  EVENTOS_DEMO,
  HAY_SUPABASE,
  INSCRIPCIONES_DEMO,
  PELEAS_DEMO,
  type Evento,
} from "@/lib/datos";
import type { Area, Bloque, CategoriaPeso, Inscripcion, ModalidadCodigo, Pelea } from "@/types";

/**
 * Cada consulta pide solo su propia tabla y confía en RLS para el filtrado por
 * organización. Nunca se arma un `where organizacion_id = ...` desde el cliente:
 * si esa condición fuera la única defensa, bastaría olvidarla una vez.
 */

export async function listarEventos(_organizacionId: string): Promise<Evento[]> {
  if (!HAY_SUPABASE) return EVENTOS_DEMO;

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("evento")
    .select("id, nombre, slug, fecha, sede, estado, plan_vence_en")
    .order("fecha", { ascending: false });

  return (data ?? []) as Evento[];
}

export async function obtenerEvento(id: string): Promise<Evento | null> {
  if (!HAY_SUPABASE) return EVENTOS_DEMO.find((e) => e.id === id) ?? EVENTO_DEMO;

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("evento")
    .select("id, nombre, slug, fecha, sede, estado, plan_vence_en")
    .eq("id", id)
    .maybeSingle();

  return (data as Evento | null) ?? null;
}

export async function obtenerAreas(eventoId: string): Promise<Area[]> {
  if (!HAY_SUPABASE) return AREAS_DEMO;

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("area")
    .select("id, nombre, tipo, hora_inicio, orden")
    .eq("evento_id", eventoId)
    .order("orden");

  return (data ?? []).map((a) => ({ ...a, modalidades: [] })) as Area[];
}

export async function obtenerPeleas(eventoId: string): Promise<Pelea[]> {
  if (!HAY_SUPABASE) return PELEAS_DEMO;

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("pelea")
    .select(
      "id, area_id, orden, roja_id, azul_id, rounds, duracion_round_seg, descanso_seg, estado, hora_estimada, hora_inicio_real, hora_fin_real"
    )
    .eq("evento_id", eventoId)
    .order("orden");

  return (data ?? []) as Pelea[];
}

export async function obtenerBloques(eventoId: string): Promise<Bloque[]> {
  if (!HAY_SUPABASE) return BLOQUES_DEMO;

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("bloque")
    .select("id, area_id, nombre, duracion_seg, despues_de_orden")
    .eq("evento_id", eventoId);

  return (data ?? []) as Bloque[];
}

interface FilaInscripcion {
  id: string;
  peleador_id: string;
  clase: Inscripcion["clase"];
  nivel: Inscripcion["nivel"];
  peso_pesaje: number | null;
  estado: Inscripcion["estado"];
  peleador: {
    nombres: string;
    apellidos: string;
    sexo: Inscripcion["sexo"];
    nacimiento: string | null;
    club_id: string | null;
    club: { nombre: string } | null;
  } | null;
  modalidad: { codigo: Inscripcion["modalidades"][number] } | null;
}

export async function obtenerInscripciones(
  eventoId: string,
  fechaEvento?: string
): Promise<Inscripcion[]> {
  if (!HAY_SUPABASE) return INSCRIPCIONES_DEMO;

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("inscripcion")
    .select(
      `id, peleador_id, clase, nivel, peso_pesaje, estado,
       peleador:peleador_id (nombres, apellidos, sexo, nacimiento, club_id, club:club_id (nombre)),
       modalidad:modalidad_id (codigo)`
    )
    .eq("evento_id", eventoId);

  const referencia = fechaEvento ? new Date(fechaEvento) : new Date();

  return ((data ?? []) as unknown as FilaInscripcion[]).map((f) => {
    let edad: number | null = null;
    if (f.peleador?.nacimiento) {
      const n = new Date(f.peleador.nacimiento);
      edad = referencia.getFullYear() - n.getFullYear();
      const m = referencia.getMonth() - n.getMonth();
      if (m < 0 || (m === 0 && referencia.getDate() < n.getDate())) edad--;
    }

    return {
      id: f.id,
      peleador_id: f.peleador_id,
      nombre: `${f.peleador?.nombres ?? ""} ${f.peleador?.apellidos ?? ""}`.trim(),
      club_id: f.peleador?.club_id ?? null,
      club: f.peleador?.club?.nombre ?? "Sin club",
      sexo: f.peleador?.sexo ?? null,
      edad,
      peso_pesaje: f.peso_pesaje,
      modalidades: f.modalidad ? [f.modalidad.codigo] : [],
      clase: f.clase,
      nivel: f.nivel,
      estado: f.estado,
    };
  });
}

export async function recalcularHorarios(eventoId: string): Promise<void> {
  if (!HAY_SUPABASE) return;
  const supabase = await crearClienteServidor();
  await supabase.rpc("recalcular_horarios", { p_evento_id: eventoId });
}

/** Solo las inscripciones del club que entrena quien llama (ver `v_mi_club`). */
export async function obtenerInscripcionesClub(eventoId: string): Promise<Inscripcion[]> {
  if (!HAY_SUPABASE) return INSCRIPCIONES_DEMO;

  const supabase = await crearClienteServidor();
  const { data: club } = await supabase.from("v_mi_club").select("id").limit(1).maybeSingle();
  if (!club) return [];

  const todas = await obtenerInscripciones(eventoId);
  return todas.filter((i) => i.club_id === club.id);
}

/**
 * Precio vigente de una inscripción según `precio_inscripcion()` (normal o
 * extemporáneo, según `evento.cierre_inscripcion`) — la lógica vive una sola
 * vez en SQL, no se duplica acá.
 */
export async function obtenerPrecioInscripcion(eventoId: string): Promise<number> {
  if (!HAY_SUPABASE) return 50;

  const supabase = await crearClienteServidor();
  const { data } = await supabase.rpc("precio_inscripcion", { p_evento_id: eventoId });
  return typeof data === "number" ? data : 0;
}

export interface CompraPlan {
  id: string;
  tipo: "academia_mes" | "academia_anio" | "evento";
  monto: number;
  vence_en: string;
  creado_en: string;
  evento_nombre: string | null;
}

export async function listarHistorialPlanes(): Promise<CompraPlan[]> {
  if (!HAY_SUPABASE) return [];

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("compra_plan")
    .select("id, tipo, monto, vence_en, creado_en, evento:evento_id (nombre)")
    .order("creado_en", { ascending: false });

  type Fila = Omit<CompraPlan, "evento_nombre"> & { evento: { nombre: string } | null };

  return ((data ?? []) as unknown as Fila[]).map((f) => ({
    ...f,
    evento_nombre: f.evento?.nombre ?? null,
  }));
}

/**
 * Categorías de peso del evento (etiqueta, no matching: ver la nota en
 * `CategoriaPeso`). `modalidad_id` se resuelve al `codigo` de la modalidad
 * embebiendo la tabla en el select, para no obligar al llamador a manejar
 * uuids que no usa en ningún otro lado del modo demo.
 */
export async function listarCategorias(eventoId: string): Promise<CategoriaPeso[]> {
  if (!HAY_SUPABASE) return CATEGORIAS_DEMO;

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("categoria")
    .select("id, nombre, sexo, peso_min, peso_max, modalidad:modalidad_id (codigo)")
    .eq("evento_id", eventoId)
    .order("peso_min");

  type Fila = Omit<CategoriaPeso, "modalidad"> & { modalidad: { codigo: ModalidadCodigo } | null };

  return ((data ?? []) as unknown as Fila[])
    .filter((f) => f.modalidad != null)
    .map((f) => ({ ...f, modalidad: f.modalidad!.codigo }));
}
