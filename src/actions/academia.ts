"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { crearClienteServidor } from "@/lib/supabase/server";
import { HAY_SUPABASE } from "@/lib/datos";
import type { EstadoFormulario } from "./estado";
export type { EstadoFormulario } from "./estado";

const academiaSchema = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  slug: z
    .string()
    .min(3, "El identificador debe tener al menos 3 caracteres")
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
});

export async function crearAcademia(
  _prev: EstadoFormulario,
  datos: FormData
): Promise<EstadoFormulario> {
  if (!HAY_SUPABASE) redirect("/app");

  const parsed = academiaSchema.safeParse({
    nombre: datos.get("nombre"),
    slug: datos.get("slug"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("crear_academia", {
    p_nombre: parsed.data.nombre,
    p_slug: parsed.data.slug,
  });

  if (error) return { error: error.message };

  revalidatePath("/app", "layout");
  redirect("/app");
}

export async function invitarMiembro(
  _prev: EstadoFormulario,
  datos: FormData
): Promise<EstadoFormulario> {
  if (!HAY_SUPABASE) return { ok: "En modo demo las invitaciones no se envían." };

  const parsed = z
    .object({
      email: z.string().email("Correo no válido"),
      rol: z.enum(["admin", "mesa", "coach", "juez", "lector"]),
    })
    .safeParse({ email: datos.get("email"), rol: datos.get("rol") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await crearClienteServidor();
  const { data: academias } = await supabase.from("v_mis_academias").select("id").limit(1);
  const organizacionId = academias?.[0]?.id;
  if (!organizacionId) return { error: "No tienes una academia" };

  const { error } = await supabase.from("invitacion").insert({
    organizacion_id: organizacionId,
    email: parsed.data.email,
    rol: parsed.data.rol,
  });

  if (error) return { error: "Esa persona ya fue invitada" };

  revalidatePath("/app/equipo");
  return { ok: `Invitación creada para ${parsed.data.email}` };
}
