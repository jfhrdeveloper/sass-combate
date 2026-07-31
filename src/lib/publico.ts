import { crearClienteServidor } from "./supabase/server";
import { crearClienteServicio } from "./supabase/admin";
import {
  AREAS_DEMO,
  BLOQUES_DEMO,
  EVENTO_DEMO,
  HAY_SUPABASE,
  PELEAS_DEMO,
  inscripcionPorId,
} from "./datos";
import { construirAgenda } from "./horarios";
import type { Area, Bloque, ModalidadCodigo, Pelea } from "./types";

/**
 * Capa de datos de las páginas públicas (/e/[org]/[evento] y /p/[token]): sin
 * sesión, así que /e lee solo por las vistas v_publico_* (abiertas a "anon" y
 * ya filtradas por evento.publico) y /p resuelve el token con service_role,
 * igual que ya hace /api/notificaciones/suscribir — el token de la URL es la
 * única autorización que existe ahí, no hace falta RLS de sesión.
 */

export interface EventoPublico {
  id: string;
  nombre: string;
  fecha: string;
  sede: string | null;
}

/** Una fila de pelea con los nombres ya resueltos, para no repetir el join en cada página. */
export interface PeleaPublica extends Pelea {
  roja: string | null;
  club_roja: string | null;
  azul: string | null;
  club_azul: string | null;
}

export interface AgendaPublica {
  evento: EventoPublico;
  areas: Area[];
  peleas: PeleaPublica[];
  bloques: Bloque[];
}

function agendaDemo(): AgendaPublica {
  const peleas: PeleaPublica[] = PELEAS_DEMO.map((p) => {
    const roja = inscripcionPorId(p.roja_id);
    const azul = inscripcionPorId(p.azul_id);
    return {
      ...p,
      roja: roja?.nombre ?? null,
      club_roja: roja?.club ?? null,
      azul: azul?.nombre ?? null,
      club_azul: azul?.club ?? null,
    };
  });
  return { evento: EVENTO_DEMO, areas: AREAS_DEMO, peleas, bloques: BLOQUES_DEMO };
}

/** Resuelve org+evento (slugs de la URL) a un evento público real, o null si no existe/no es público. */
export async function obtenerAgendaPublica(
  org: string,
  eventoSlug: string
): Promise<AgendaPublica | null> {
  if (!HAY_SUPABASE) return agendaDemo();

  const supabase = await crearClienteServidor();
  const { data: evento } = await supabase
    .from("v_publico_evento")
    .select("id, nombre, fecha, sede")
    .eq("organizacion_slug", org)
    .eq("evento_slug", eventoSlug)
    .maybeSingle();

  if (!evento) return null;

  const [{ data: areas }, { data: peleas }, { data: bloques }] = await Promise.all([
    supabase
      .from("v_publico_area")
      .select("id, nombre, tipo, hora_inicio, orden")
      .eq("evento_id", evento.id)
      .order("orden"),
    supabase
      .from("v_publico_pelea")
      .select(
        "id, area_id, orden, roja_id, azul_id, rounds, duracion_round_seg, descanso_seg, estado, hora_estimada, hora_inicio_real, hora_fin_real, roja, club_roja, azul, club_azul"
      )
      .eq("evento_id", evento.id)
      .order("orden"),
    supabase
      .from("v_publico_bloque")
      .select("id, area_id, nombre, duracion_seg, despues_de_orden")
      .eq("evento_id", evento.id),
  ]);

  return {
    evento,
    areas: (areas ?? []).map((a) => ({ ...a, modalidades: [] })) as Area[],
    peleas: (peleas ?? []) as PeleaPublica[],
    bloques: (bloques ?? []) as Bloque[],
  };
}

export interface CredencialPeleador {
  yo: {
    nombre: string;
    club: string | null;
    peso_pesaje: number | null;
    clase: string | null;
    modalidades: ModalidadCodigo[];
  };
  pelea: Pelea | null;
  area: Area | null;
  fila: { inicio: Date; orden: number } | null;
  retrasoSeg: number;
  rival: { nombre: string; club: string | null } | null;
}

function credencialDemo(): CredencialPeleador | null {
  const agendas = construirAgenda(AREAS_DEMO, PELEAS_DEMO, BLOQUES_DEMO);
  const fila = agendas
    .flatMap((a) => a.filas)
    .find((f) => f.tipo === "pelea" && f.estado !== "finalizada");
  const pelea = PELEAS_DEMO.find((p) => p.id === fila?.id) ?? null;
  const yo = inscripcionPorId(pelea?.roja_id ?? null);
  const rival = inscripcionPorId(pelea?.azul_id ?? null);
  const area = AREAS_DEMO.find((a) => a.id === pelea?.area_id) ?? null;
  const retrasoSeg = agendas.find((a) => a.area.id === area?.id)?.retrasoSeg ?? 0;

  if (!yo || !pelea || !fila) return null;

  return {
    yo: {
      nombre: yo.nombre,
      club: yo.club,
      peso_pesaje: yo.peso_pesaje,
      clase: yo.clase,
      modalidades: yo.modalidades,
    },
    pelea,
    area,
    fila: { inicio: fila.inicio, orden: fila.orden },
    retrasoSeg,
    rival: rival ? { nombre: rival.nombre, club: rival.club } : null,
  };
}

interface FilaPeleadorNombre {
  peleador: { nombres: string; apellidos: string; club: { nombre: string } | null } | null;
}

interface FilaInscripcionToken extends FilaPeleadorNombre {
  id: string;
  evento_id: string;
  peso_pesaje: number | null;
  clase: string | null;
  modalidad: { codigo: ModalidadCodigo } | null;
}

/**
 * Resuelve la credencial personal por token. El token ya autoriza ver esta
 * pelea sin sesión (igual que /api/notificaciones/suscribir), por eso se
 * consulta con service_role en vez de depender de RLS pensado para miembros.
 */
export async function obtenerCredencialPorToken(token: string): Promise<CredencialPeleador | null> {
  if (!HAY_SUPABASE) return credencialDemo();

  const servicio = crearClienteServicio();
  const { data: inscripcion } = await servicio
    .from("inscripcion")
    .select(
      `id, evento_id, peso_pesaje, clase,
       peleador:peleador_id (nombres, apellidos, club:club_id (nombre)),
       modalidad:modalidad_id (codigo)`
    )
    .eq("token", token)
    .maybeSingle();

  if (!inscripcion) return null;
  const insTipada = inscripcion as unknown as FilaInscripcionToken;
  const yoPeleador = insTipada.peleador;
  if (!yoPeleador) return null;

  const [{ data: areas }, { data: peleas }, { data: bloques }] = await Promise.all([
    servicio
      .from("area")
      .select("id, nombre, tipo, hora_inicio, orden")
      .eq("evento_id", inscripcion.evento_id)
      .order("orden"),
    servicio
      .from("pelea")
      .select(
        "id, area_id, orden, roja_id, azul_id, rounds, duracion_round_seg, descanso_seg, estado, hora_estimada, hora_inicio_real, hora_fin_real"
      )
      .eq("evento_id", inscripcion.evento_id)
      .order("orden"),
    servicio
      .from("bloque")
      .select("id, area_id, nombre, duracion_seg, despues_de_orden")
      .eq("evento_id", inscripcion.evento_id),
  ]);

  const areasTyped = (areas ?? []).map((a) => ({ ...a, modalidades: [] })) as Area[];
  const peleasTyped = (peleas ?? []) as Pelea[];

  const propia =
    peleasTyped.find(
      (p) =>
        (p.roja_id === inscripcion.id || p.azul_id === inscripcion.id) &&
        p.estado !== "finalizada"
    ) ?? null;

  if (!propia) {
    return {
      yo: {
        nombre: `${yoPeleador.nombres} ${yoPeleador.apellidos}`,
        club: yoPeleador.club?.nombre ?? null,
        peso_pesaje: inscripcion.peso_pesaje,
        clase: insTipada.clase,
        modalidades: insTipada.modalidad ? [insTipada.modalidad.codigo] : [],
      },
      pelea: null,
      area: null,
      fila: null,
      retrasoSeg: 0,
      rival: null,
    };
  }

  const agendas = construirAgenda(areasTyped, peleasTyped, (bloques ?? []) as Bloque[]);
  const fila = agendas.flatMap((a) => a.filas).find((f) => f.id === propia.id) ?? null;
  const area = areasTyped.find((a) => a.id === propia.area_id) ?? null;
  const retrasoSeg = agendas.find((a) => a.area.id === area?.id)?.retrasoSeg ?? 0;

  const rivalId = propia.roja_id === inscripcion.id ? propia.azul_id : propia.roja_id;
  let rival: CredencialPeleador["rival"] = null;
  if (rivalId) {
    const { data: rivalIns } = await servicio
      .from("inscripcion")
      .select(`peleador:peleador_id (nombres, apellidos, club:club_id (nombre))`)
      .eq("id", rivalId)
      .maybeSingle();
    const rivalPeleador = (rivalIns as unknown as FilaPeleadorNombre | null)?.peleador;
    if (rivalPeleador) {
      rival = { nombre: `${rivalPeleador.nombres} ${rivalPeleador.apellidos}`, club: rivalPeleador.club?.nombre ?? null };
    }
  }

  return {
    yo: {
      nombre: `${yoPeleador.nombres} ${yoPeleador.apellidos}`,
      club: yoPeleador.club?.nombre ?? null,
      peso_pesaje: inscripcion.peso_pesaje,
      clase: insTipada.clase,
      modalidades: insTipada.modalidad ? [insTipada.modalidad.codigo] : [],
    },
    pelea: propia,
    area,
    fila: fila ? { inicio: fila.inicio, orden: fila.orden } : null,
    retrasoSeg,
    rival,
  };
}
