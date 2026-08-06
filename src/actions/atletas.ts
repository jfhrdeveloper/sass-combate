"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { crearClienteServidor } from "@/lib/supabase/server";
import { HAY_SUPABASE } from "@/lib/datos";
import { peleasEnOtrasAcademias } from "@/services/atletas";
import type { EstadoFormulario } from "./estado";
export type { EstadoFormulario } from "./estado";

export async function registrarPeleaExterna(
  _prev: EstadoFormulario,
  datos: FormData
): Promise<EstadoFormulario> {
  const parsed = z
    .object({
      atletaId: z.string().min(1),
      fecha: z.string().min(8, "Elige una fecha"),
      evento: z.string().min(3, "Escribe el nombre del evento"),
      disciplina: z.string().min(3, "Escribe la disciplina"),
      rival: z.string().optional(),
      resultado: z.enum(["victoria", "derrota", "empate", "exhibicion"]),
      metodo: z.string().optional(),
    })
    .safeParse(Object.fromEntries(datos));

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  if (!HAY_SUPABASE) {
    return { ok: "En modo demo el historial no se guarda." };
  }

  const supabase = await crearClienteServidor();
  const { data: academias } = await supabase.from("v_mis_academias").select("id").limit(1);

  const { error } = await supabase.from("historial_pelea").insert({
    atleta_id: parsed.data.atletaId,
    organizacion_id: academias?.[0]?.id ?? null,
    fecha: parsed.data.fecha,
    evento: parsed.data.evento,
    disciplina: parsed.data.disciplina,
    rival: parsed.data.rival || null,
    resultado: parsed.data.resultado,
    metodo: parsed.data.metodo || null,
    externa: true,
  });

  if (error) return { error: "No se pudo guardar la pelea" };

  revalidatePath(`/app/atletas`);
  return { ok: "Pelea agregada al historial" };
}

const datosPersonaSchema = z.object({
  nombres: z.string().min(1, "Escribe el nombre"),
  apellidos: z.string().min(1, "Escribe el apellido"),
  nacimiento: z.string().optional(),
  sexo: z.enum(["M", "F", "sin_dato"]).optional(),
});

/**
 * Cada academia tiene su propia fila en `peleador` para la misma persona
 * (documento/nombres/apellidos/nacimiento/sexo son de ESA fila, no del
 * registro compartido `atleta`) — decisión explícita del usuario, sesión
 * del 2026-08-06: las academias no comparten esta información entre sí.
 * `atleta` sigue existiendo por dentro (upsert por documento) solo para que
 * el trigger `registrar_en_historial()` sepa a quién anotarle un resultado
 * y para que funcione `peleasEnOtrasAcademias` — nunca se expone como
 * concepto ni se usa para autocompletar datos entre academias.
 */
export async function crearPeleador(
  _prev: EstadoFormulario,
  datos: FormData
): Promise<EstadoFormulario> {
  const parsed = datosPersonaSchema
    .extend({ documento: z.string().min(1, "Escribe el documento") })
    .safeParse(Object.fromEntries(datos));

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  if (!HAY_SUPABASE) return { ok: "Modo demo: no se guarda." };

  const supabase = await crearClienteServidor();
  const { data: academias } = await supabase.from("v_mis_academias").select("id").limit(1);
  const organizacionId = academias?.[0]?.id;
  if (!organizacionId) return { error: "No tienes una academia" };

  const { nombres, apellidos, documento } = parsed.data;
  const nacimiento = parsed.data.nacimiento || null;
  const sexo = parsed.data.sexo === "sin_dato" ? null : parsed.data.sexo ?? null;

  // Enlace interno con el registro compartido (ver comentario de arriba):
  // no se le pide nada nuevo al usuario, solo hace posible el historial y
  // la búsqueda cruzada opcional.
  const { data: atleta } = await supabase
    .from("atleta")
    .upsert({ documento, nombres, apellidos, nacimiento, sexo }, { onConflict: "documento" })
    .select("id")
    .single();

  const { data: peleador, error } = await supabase
    .from("peleador")
    .upsert(
      {
        organizacion_id: organizacionId,
        atleta_id: atleta?.id ?? null,
        documento,
        nombres,
        apellidos,
        nacimiento,
        sexo,
      },
      { onConflict: "organizacion_id,documento" }
    )
    .select("id")
    .single();

  if (error || !peleador) return { error: "No se pudo registrar" };

  revalidatePath("/app/atletas");
  redirect(`/app/atletas/${peleador.id}`);
}

/**
 * Edita SOLO la fila de tu academia (`peleador`), nunca el registro
 * compartido `atleta` — así lo que corrijas no se filtra a otra academia.
 * El documento no se puede tocar acá: es la clave que enlaza con `atleta`
 * por dentro; cambiarlo después de creado rompería ese enlace.
 */
export async function editarPeleador(
  _prev: EstadoFormulario,
  datos: FormData
): Promise<EstadoFormulario> {
  const parsed = datosPersonaSchema
    .extend({ peleadorId: z.string().min(1) })
    .safeParse(Object.fromEntries(datos));

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  if (!HAY_SUPABASE) return { ok: "En modo demo no se guarda." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("peleador")
    .update({
      nombres: parsed.data.nombres,
      apellidos: parsed.data.apellidos,
      nacimiento: parsed.data.nacimiento || null,
      sexo: parsed.data.sexo === "sin_dato" ? null : parsed.data.sexo ?? null,
    })
    .eq("id", parsed.data.peleadorId);

  if (error) return { error: "No se pudo actualizar" };

  revalidatePath(`/app/atletas/${parsed.data.peleadorId}`);
  revalidatePath("/app/atletas");
  return { ok: "Datos actualizados" };
}

/**
 * Borra solo lo que registró TU academia: la fila de `peleador` y el
 * historial de pelea que tu organización le cargó. No toca el registro
 * compartido `atleta` (otras academias pueden seguir usándolo) ni el
 * historial que haya registrado cualquier otra organización — RLS ya
 * scopea ambos deletes por `organizacion_id`, esto no necesitó una
 * política nueva (`peleador_escritura`/`historial_escritura` ya cubrían
 * este caso desde el esquema base).
 */
export async function eliminarPeleador(
  _prev: EstadoFormulario,
  datos: FormData
): Promise<EstadoFormulario> {
  const peleadorId = String(datos.get("peleadorId") ?? "");
  const atletaId = String(datos.get("atletaId") ?? "");
  if (!peleadorId) return { error: "Falta el peleador a eliminar" };

  if (!HAY_SUPABASE) return { ok: "Modo demo: no se guarda." };

  const supabase = await crearClienteServidor();
  const { data: academias } = await supabase.from("v_mis_academias").select("id").limit(1);
  const organizacionId = academias?.[0]?.id;
  if (!organizacionId) return { error: "No tienes una academia" };

  if (atletaId) {
    await supabase
      .from("historial_pelea")
      .delete()
      .eq("atleta_id", atletaId)
      .eq("organizacion_id", organizacionId);
  }

  const { error } = await supabase.from("peleador").delete().eq("id", peleadorId);
  if (error) return { error: "No se pudo eliminar" };

  revalidatePath("/app/atletas");
  return { ok: "Eliminado de tu academia" };
}

/** Búsqueda explícita, bajo demanda: nunca se dispara sola. Ver
 *  `peleasEnOtrasAcademias` (services/atletas.ts) y `peleas_otras_academias`
 *  (migración 20260101000018) para el porqué no filtra ni expone detalle. */
export async function consultarOtrasAcademias(
  _prev: EstadoFormulario,
  datos: FormData
): Promise<EstadoFormulario> {
  const documento = String(datos.get("documento") ?? "");
  if (!documento) return { error: "Falta el documento" };

  const n = await peleasEnOtrasAcademias(documento);
  return n > 0
    ? { ok: `Tiene ${n} pelea${n === 1 ? "" : "s"} registrada${n === 1 ? "" : "s"} en otra academia de sass-combate.` }
    : { ok: "No se encontraron peleas de esta persona en otras academias de sass-combate." };
}
