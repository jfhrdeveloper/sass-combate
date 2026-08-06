"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { crearClienteServidor } from "@/lib/supabase/server";
import { HAY_SUPABASE } from "@/lib/datos";
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

  revalidatePath(`/app/atletas/${parsed.data.atletaId}`);
  return { ok: "Pelea agregada al historial" };
}

/**
 * `atleta` es un registro compartido entre academias a propósito (ver el
 * comentario en `supabase/migrations/20260101000004_historial_y_plataforma.sql`):
 * corregir un nombre o una fecha de nacimiento mal cargados es seguro y ya
 * lo permite la política `atleta_actualizacion` (cualquier miembro de
 * cualquier academia puede actualizar, existía desde el primer commit). El
 * documento (`documento`) no se puede editar acá porque es la clave que
 * cruza el registro entre academias — cambiarlo rompería ese cruce.
 *
 * A propósito NO existe una acción de eliminar atleta: borrar esta fila
 * arrastra (`on delete cascade`) el historial de pelea de TODAS las
 * academias que compartan a este atleta, no solo la que hace el borrado.
 * Ninguna política de RLS permite el delete hoy (a diferencia de update,
 * que sí tiene una desde el esquema base) — es una omisión deliberada del
 * schema, no un descuido; habilitarla necesita una decisión de producto
 * aparte (¿soft delete?, ¿solo puede borrar quien lo creó?), no algo que
 * este botón deba resolver de paso. Ver docs/pending-task.md.
 */
export async function editarAtleta(
  _prev: EstadoFormulario,
  datos: FormData
): Promise<EstadoFormulario> {
  const parsed = z
    .object({
      atletaId: z.string().min(1),
      nombres: z.string().min(1, "Escribe el nombre"),
      apellidos: z.string().min(1, "Escribe el apellido"),
      nacimiento: z.string().optional(),
      sexo: z.enum(["M", "F", "sin_dato"]).optional(),
    })
    .safeParse(Object.fromEntries(datos));

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  if (!HAY_SUPABASE) return { ok: "En modo demo no se guarda." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("atleta")
    .update({
      nombres: parsed.data.nombres,
      apellidos: parsed.data.apellidos,
      nacimiento: parsed.data.nacimiento || null,
      sexo: parsed.data.sexo === "sin_dato" ? null : parsed.data.sexo ?? null,
      actualizado_en: new Date().toISOString(),
    })
    .eq("id", parsed.data.atletaId);

  if (error) return { error: "No se pudo actualizar" };

  revalidatePath(`/app/atletas/${parsed.data.atletaId}`);
  revalidatePath("/app/atletas");
  return { ok: "Datos actualizados" };
}
