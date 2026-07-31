"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers, cookies } from "next/headers";
import { z } from "zod";
import { crearClienteServidor } from "@/lib/supabase/server";
import { HAY_SUPABASE } from "@/lib/datos";
import { ROLES, COOKIE_ROL_DEMO, CUENTAS_DEMO, type Academia } from "@/services/auth";
import type { EstadoFormulario } from "./estado";
export type { EstadoFormulario } from "./estado";

const credenciales = z.object({
  email: z.string().email("Correo no válido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

async function origen(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const protocolo = host.startsWith("localhost") ? "http" : "https";
  return `${protocolo}://${host}`;
}

export async function entrar(
  _prev: EstadoFormulario,
  datos: FormData
): Promise<EstadoFormulario> {
  const volverDemo = String(datos.get("volver") ?? "/app");

  if (!HAY_SUPABASE) {
    const email = String(datos.get("email") ?? "").trim().toLowerCase();
    const password = String(datos.get("password") ?? "");
    const cuenta = CUENTAS_DEMO.find((c) => c.email === email);

    if (!cuenta) return { error: "Correo no reconocido. Usá una de las cuentas de prueba." };
    if (cuenta.password !== password) return { error: "Contraseña incorrecta" };

    const jar = await cookies();
    jar.set(COOKIE_ROL_DEMO, cuenta.rol, { path: "/" });
    redirect(volverDemo.startsWith("/") ? volverDemo : "/app");
  }

  const parsed = credenciales.safeParse({
    email: datos.get("email"),
    password: datos.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Correo o contraseña incorrectos" };

  const volver = String(datos.get("volver") ?? "/app");
  revalidatePath("/", "layout");
  redirect(volver.startsWith("/") ? volver : "/app");
}

export async function registrarse(
  _prev: EstadoFormulario,
  datos: FormData
): Promise<EstadoFormulario> {
  if (!HAY_SUPABASE) redirect("/nueva-academia");

  const parsed = credenciales
    .extend({ nombre: z.string().min(2, "Escribe tu nombre") })
    .safeParse({
      email: datos.get("email"),
      password: datos.get("password"),
      nombre: datos.get("nombre"),
    });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.nombre },
      emailRedirectTo: `${await origen()}/auth/callback`,
    },
  });

  if (error) {
    return {
      error: error.message.includes("already")
        ? "Ese correo ya tiene una cuenta"
        : "No se pudo crear la cuenta",
    };
  }

  return { ok: "Revisa tu correo para confirmar la cuenta." };
}

export async function entrarConGoogle(datos: FormData) {
  if (!HAY_SUPABASE) redirect("/app");

  const volver = String(datos.get("volver") ?? "/app");
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${await origen()}/auth/callback?volver=${encodeURIComponent(volver)}`,
    },
  });

  if (error || !data.url) redirect("/entrar?error=google");
  redirect(data.url);
}

/**
 * Solo modo demo: simula entrar con otro rol sin necesitar cuentas reales.
 * No existe (ni debe existir) un equivalente en producción — ahí el rol
 * viene de la tabla `miembro`, nunca de algo que el propio usuario elige.
 */
export async function cambiarRolDemo(formData: FormData) {
  const volver = (formData.get("volver") as string | null) || "/app";
  if (!HAY_SUPABASE) {
    const rol = formData.get("rol");
    if (typeof rol === "string" && ROLES.includes(rol as Academia["rol"])) {
      const jar = await cookies();
      jar.set(COOKIE_ROL_DEMO, rol, { path: "/" });
    }
  }
  // El redirect (no solo revalidatePath) es necesario para forzar una
  // request nueva: dentro de esta misma acción, el render ya en curso
  // todavía ve la cookie vieja.
  redirect(volver);
}

export async function salir() {
  if (HAY_SUPABASE) {
    const supabase = await crearClienteServidor();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/");
}
