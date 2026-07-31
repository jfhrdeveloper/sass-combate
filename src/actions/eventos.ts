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
