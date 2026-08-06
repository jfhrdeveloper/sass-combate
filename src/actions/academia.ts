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

/** No deja sacar a un dueño desde acá — transferir o quitar la titularidad
 *  de la academia es un flujo aparte, no algo que este botón deba resolver
 *  de paso. RLS (`miembro_eliminacion`) además exige que quien saca sea
 *  dueño/admin de esa misma organización. */
export async function eliminarMiembro(
  _prev: EstadoFormulario,
  datos: FormData
): Promise<EstadoFormulario> {
  const miembroId = String(datos.get("miembroId") ?? "");
  if (!miembroId) return { error: "Falta el miembro a eliminar" };

  if (!HAY_SUPABASE) return { ok: "Modo demo: no se guarda." };

  const supabase = await crearClienteServidor();
  const { data: fila } = await supabase.from("miembro").select("rol").eq("id", miembroId).maybeSingle();
  if (fila?.rol === "dueno") {
    return { error: "No se puede quitar al dueño de la academia desde acá" };
  }

  const { error } = await supabase.from("miembro").delete().eq("id", miembroId);
  if (error) return { error: "No se pudo quitar a esa persona" };

  revalidatePath("/app/equipo");
  return { ok: "Miembro eliminado" };
}

export async function cancelarInvitacion(
  _prev: EstadoFormulario,
  datos: FormData
): Promise<EstadoFormulario> {
  const invitacionId = String(datos.get("invitacionId") ?? "");
  if (!invitacionId) return { error: "Falta la invitación a cancelar" };

  if (!HAY_SUPABASE) return { ok: "Modo demo: no se guarda." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("invitacion").delete().eq("id", invitacionId);
  if (error) return { error: "No se pudo cancelar la invitación" };

  revalidatePath("/app/equipo");
  return { ok: "Invitación cancelada" };
}
