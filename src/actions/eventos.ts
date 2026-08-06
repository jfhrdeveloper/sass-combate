"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { crearClienteServidor } from "@/lib/supabase/server";
import { HAY_SUPABASE } from "@/lib/datos";
import { LIMITE_EVENTOS_GRATIS, planEstaActivo } from "@/lib/planes";
import type { EstadoFormulario } from "./estado";
export type { EstadoFormulario } from "./estado";

const eventoSchema = z.object({
  nombre: z.string().min(3, "Escribe el nombre del evento"),
  fecha: z.string().min(8, "Elige una fecha"),
  sede: z.string().optional(),
});

/** Marcas diacríticas combinantes (acentos sueltos tras NFD). Construido con
 *  fromCharCode en vez de un literal `[̀-ͯ]` para no depender de
 *  cómo el editor normalice esos bytes en el archivo fuente. */
const RANGO_DIACRITICOS = new RegExp(
  String.fromCharCode(91, 0x0300) + "-" + String.fromCharCode(0x036f, 93),
  "g"
);

export async function crearEvento(
  _prev: EstadoFormulario,
  datos: FormData
): Promise<EstadoFormulario> {
  if (!HAY_SUPABASE) redirect("/app/eventos/demo");

  const parsed = eventoSchema.safeParse({
    nombre: datos.get("nombre"),
    fecha: datos.get("fecha"),
    sede: datos.get("sede"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await crearClienteServidor();
  const { data: academias } = await supabase
    .from("v_mis_academias")
    .select("id, plan, plan_vence_en")
    .limit(1);
  const organizacionId = academias?.[0]?.id;
  const academia = academias?.[0];
  if (!organizacionId) redirect("/nueva-academia");

  // El plan Gratis cubre un solo evento activo a la vez (ver /#precios).
  if (!planEstaActivo(academia?.plan ?? null, academia?.plan_vence_en ?? null)) {
    const { count } = await supabase
      .from("evento")
      .select("id", { count: "exact", head: true })
      .eq("organizacion_id", organizacionId)
      .neq("estado", "finalizado");
    if ((count ?? 0) >= LIMITE_EVENTOS_GRATIS) {
      return {
        error:
          "El plan Gratis cubre un solo evento activo a la vez. Cierra el actual o activa un plan en /app/plan para crear otro.",
      };
    }
  }

  const slug = parsed.data.nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(RANGO_DIACRITICOS, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { data, error } = await supabase
    .from("evento")
    .insert({
      organizacion_id: organizacionId,
      nombre: parsed.data.nombre,
      slug,
      fecha: parsed.data.fecha,
      sede: parsed.data.sede || null,
    })
    .select("id")
    .single();

  if (error) return { error: "No se pudo crear el evento" };

  revalidatePath("/app");
  redirect(`/app/eventos/${data.id}`);
}

const categoriaSchema = z
  .object({
    eventoId: z.string().min(1),
    nombre: z.string().min(1, "Escribe un nombre para la categoría"),
    modalidad: z.string().min(1, "Elige una modalidad"),
    sexo: z.enum(["M", "F"]).optional(),
    pesoMin: z.coerce.number().positive().optional(),
    pesoMax: z.coerce.number().positive().optional(),
  })
  .refine((d) => d.pesoMin != null || d.pesoMax != null, {
    message: "Define al menos un peso mínimo o máximo (iguales para un peso exacto)",
    path: ["pesoMin"],
  });

/**
 * Crea una categoría de peso con nombre para un evento — solo una etiqueta
 * visual (ver `CategoriaPeso` en `src/types/index.ts`), no toca el
 * emparejador. `categoria.modalidad_id` es un uuid en la base; acá se
 * resuelve desde el `codigo` que manda el formulario, prefiriendo una
 * modalidad propia de la organización sobre la del catálogo global si
 * ambas existen con el mismo código.
 */
export async function crearCategoria(
  _prev: EstadoFormulario,
  datos: FormData
): Promise<EstadoFormulario> {
  const parsed = categoriaSchema.safeParse({
    eventoId: datos.get("eventoId"),
    nombre: datos.get("nombre"),
    modalidad: datos.get("modalidad"),
    sexo: datos.get("sexo") === "todos" ? undefined : datos.get("sexo") || undefined,
    pesoMin: datos.get("pesoMin") || undefined,
    pesoMax: datos.get("pesoMax") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  if (!HAY_SUPABASE) return { ok: "Modo demo: la categoría no se guarda." };

  const supabase = await crearClienteServidor();
  const { data: academias } = await supabase.from("v_mis_academias").select("id").limit(1);
  const organizacionId = academias?.[0]?.id;
  if (!organizacionId) return { error: "No tienes una academia" };

  const { data: modalidades } = await supabase
    .from("modalidad")
    .select("id, organizacion_id")
    .eq("codigo", parsed.data.modalidad)
    .or(`organizacion_id.eq.${organizacionId},organizacion_id.is.null`);
  const modalidad =
    modalidades?.find((m) => m.organizacion_id === organizacionId) ??
    modalidades?.find((m) => m.organizacion_id === null);
  if (!modalidad) return { error: "Modalidad no encontrada" };

  const { error } = await supabase.from("categoria").insert({
    organizacion_id: organizacionId,
    evento_id: parsed.data.eventoId,
    modalidad_id: modalidad.id,
    nombre: parsed.data.nombre,
    sexo: parsed.data.sexo ?? null,
    peso_min: parsed.data.pesoMin ?? null,
    peso_max: parsed.data.pesoMax ?? null,
  });
  if (error) return { error: "No se pudo crear la categoría" };

  revalidatePath(`/app/eventos/${parsed.data.eventoId}`);
  return { ok: "Categoría creada" };
}

const categoriaEditSchema = z
  .object({
    categoriaId: z.string().min(1),
    eventoId: z.string().min(1),
    nombre: z.string().min(1, "Escribe un nombre para la categoría"),
    sexo: z.enum(["M", "F"]).optional(),
    pesoMin: z.coerce.number().positive().optional(),
    pesoMax: z.coerce.number().positive().optional(),
  })
  .refine((d) => d.pesoMin != null || d.pesoMax != null, {
    message: "Define al menos un peso mínimo o máximo (iguales para un peso exacto)",
    path: ["pesoMin"],
  });

/** Mismas reglas de peso/sexo que `crearCategoria`, pero sobre una fila
 *  existente (`.update()` en vez de `.insert()`). No deja tocar la
 *  modalidad: cambiarla reventaría los cruces del emparejador que ya la
 *  usan como filtro; para cambiar de modalidad hay que borrar y crear de
 *  nuevo, a propósito. */
export async function editarCategoria(
  _prev: EstadoFormulario,
  datos: FormData
): Promise<EstadoFormulario> {
  const parsed = categoriaEditSchema.safeParse({
    categoriaId: datos.get("categoriaId"),
    eventoId: datos.get("eventoId"),
    nombre: datos.get("nombre"),
    sexo: datos.get("sexo") === "todos" ? undefined : datos.get("sexo") || undefined,
    pesoMin: datos.get("pesoMin") || undefined,
    pesoMax: datos.get("pesoMax") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  if (!HAY_SUPABASE) return { ok: "Modo demo: la categoría no se guarda." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("categoria")
    .update({
      nombre: parsed.data.nombre,
      sexo: parsed.data.sexo ?? null,
      peso_min: parsed.data.pesoMin ?? null,
      peso_max: parsed.data.pesoMax ?? null,
    })
    .eq("id", parsed.data.categoriaId);
  if (error) return { error: "No se pudo actualizar la categoría" };

  revalidatePath(`/app/eventos/${parsed.data.eventoId}`);
  return { ok: "Categoría actualizada" };
}

export async function eliminarCategoria(
  _prev: EstadoFormulario,
  datos: FormData
): Promise<EstadoFormulario> {
  const eventoId = String(datos.get("eventoId") ?? "");
  const categoriaId = String(datos.get("categoriaId") ?? "");
  if (!eventoId || !categoriaId) return { error: "Faltan datos" };

  if (!HAY_SUPABASE) return { ok: "Modo demo: no se guarda." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("categoria").delete().eq("id", categoriaId);
  if (error) return { error: "No se pudo eliminar la categoría" };

  revalidatePath(`/app/eventos/${eventoId}`);
  return { ok: "Categoría eliminada" };
}
