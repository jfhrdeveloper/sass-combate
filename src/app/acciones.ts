"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers, cookies } from "next/headers";
import { z } from "zod";
import { crearClienteServidor } from "@/lib/supabase/server";
import { HAY_SUPABASE } from "@/lib/datos";
import { crearReclamo, responderReclamo } from "@/lib/reclamos";
import { LIMITE_EVENTOS_GRATIS, planEstaActivo } from "@/lib/planes";
import { ROLES, COOKIE_ROL_DEMO, CUENTAS_DEMO, type Academia } from "@/lib/auth";

export interface EstadoFormulario {
  error?: string;
  ok?: string;
}

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

const academia = z.object({
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

  const parsed = academia.safeParse({
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

const evento = z.object({
  nombre: z.string().min(3, "Escribe el nombre del evento"),
  fecha: z.string().min(8, "Elige una fecha"),
  sede: z.string().optional(),
});

export async function crearEvento(
  _prev: EstadoFormulario,
  datos: FormData
): Promise<EstadoFormulario> {
  if (!HAY_SUPABASE) redirect("/app/eventos/demo");

  const parsed = evento.safeParse({
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
    .replace(/[\u0300-\u036f]/g, "")
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

export async function registrarPago(
  _prev: EstadoFormulario,
  datos: FormData
): Promise<EstadoFormulario> {
  const parsed = z
    .object({
      eventoId: z.string().min(1),
      metodo: z.enum(["yape", "plin", "transferencia", "efectivo", "tarjeta"]),
      monto: z.coerce.number().min(0),
      referencia: z.string().optional(),
    })
    .safeParse({
      eventoId: datos.get("eventoId"),
      metodo: datos.get("metodo"),
      monto: datos.get("monto"),
      referencia: datos.get("referencia"),
    });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  if (!HAY_SUPABASE) {
    return { ok: "En modo demo el pago no se registra." };
  }

  const supabase = await crearClienteServidor();
  const { data: academias } = await supabase.from("v_mis_academias").select("id").limit(1);
  const organizacionId = academias?.[0]?.id;
  if (!organizacionId) return { error: "No tienes una academia" };

  const { data: club } = await supabase.from("v_mi_club").select("id").limit(1).maybeSingle();

  let comprobanteUrl: string | null = null;
  const archivo = datos.get("comprobante");
  if (archivo instanceof File && archivo.size > 0) {
    if (archivo.size > 5_000_000) return { error: "La imagen no debe pasar de 5 MB" };
    const ruta = `${organizacionId}/${parsed.data.eventoId}/${Date.now()}-${archivo.name}`;
    const { error: errSubida } = await supabase.storage
      .from("comprobantes")
      .upload(ruta, archivo, { upsert: false });
    if (errSubida) return { error: "No se pudo subir la imagen" };
    comprobanteUrl = ruta;
  }

  const { data: pago, error } = await supabase
    .from("pago")
    .insert({
      organizacion_id: organizacionId,
      evento_id: parsed.data.eventoId,
      club_id: club?.id ?? null,
      metodo: parsed.data.metodo,
      monto: parsed.data.monto,
      referencia: parsed.data.referencia || null,
      comprobante_url: comprobanteUrl,
      estado: "en_revision",
    })
    .select("id")
    .single();

  if (error || !pago) return { error: "No se pudo registrar el pago" };

  // Vincula ahora las inscripciones pendientes del club: cuando el organizador
  // apruebe este pago, el trigger aplicar_pago ya las va a encontrar.
  await supabase.rpc("vincular_pago_inscripciones", {
    p_pago_id: pago.id,
    p_evento_id: parsed.data.eventoId,
    p_club_id: club?.id ?? null,
  });

  revalidatePath("/app/mi-club");
  return { ok: "Comprobante enviado. El organizador lo va a revisar." };
}

export async function revisarPago(
  _prev: EstadoFormulario,
  datos: FormData
): Promise<EstadoFormulario> {
  const parsed = z
    .object({
      pagoId: z.string().min(1),
      decision: z.enum(["aprobado", "rechazado"]),
      motivo: z.string().optional(),
    })
    .safeParse(Object.fromEntries(datos));

  if (!parsed.success) return { error: "Datos incompletos" };
  if (!HAY_SUPABASE) return { ok: "En modo demo no se revisa." };

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("pago")
    .update({
      estado: parsed.data.decision,
      motivo_rechazo: parsed.data.decision === "rechazado" ? parsed.data.motivo : null,
      revisado_por: user?.id ?? null,
      revisado_en: new Date().toISOString(),
    })
    .eq("id", parsed.data.pagoId);

  if (error) return { error: "No se pudo actualizar el pago" };

  revalidatePath("/app/pagos");
  return { ok: parsed.data.decision === "aprobado" ? "Pago aprobado" : "Pago rechazado" };
}

const reclamoSchema = z.object({
  tipo: z.enum(["reclamo", "queja"]),
  consumidorNombre: z.string().min(3, "Escribe tu nombre completo"),
  documentoTipo: z.enum(["dni", "ce", "pasaporte"]),
  documentoNumero: z.string().min(6, "Documento no válido"),
  consumidorDomicilio: z.string().min(5, "Escribe tu domicilio"),
  consumidorTelefono: z.string().optional(),
  consumidorCorreo: z.string().email("Correo no válido"),
  esMenorEdad: z.string().optional(),
  tutorNombre: z.string().optional(),
  bienOServicio: z.string().min(3, "Indica el plan o servicio por el que reclamas"),
  montoReclamado: z.coerce.number().optional(),
  detalle: z.string().min(10, "Cuéntanos con más detalle qué pasó"),
  pedido: z.string().min(3, "Indica qué solicitas"),
});

export async function enviarReclamo(
  _prev: EstadoFormulario,
  datos: FormData
): Promise<EstadoFormulario> {
  const parsed = reclamoSchema.safeParse(Object.fromEntries(datos));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const resultado = await crearReclamo({
    tipo: parsed.data.tipo,
    consumidor_nombre: parsed.data.consumidorNombre,
    documento_tipo: parsed.data.documentoTipo,
    documento_numero: parsed.data.documentoNumero,
    consumidor_domicilio: parsed.data.consumidorDomicilio,
    consumidor_telefono: parsed.data.consumidorTelefono || undefined,
    consumidor_correo: parsed.data.consumidorCorreo,
    es_menor_edad: parsed.data.esMenorEdad === "on",
    tutor_nombre: parsed.data.tutorNombre || undefined,
    bien_o_servicio: parsed.data.bienOServicio,
    monto_reclamado: parsed.data.montoReclamado,
    detalle: parsed.data.detalle,
    pedido: parsed.data.pedido,
  });

  if (!resultado.ok) return { error: resultado.error };

  return {
    ok:
      resultado.numero === null
        ? "Modo demo: en producción este reclamo se guardaría y te llegaría un número de seguimiento."
        : `Reclamo registrado con el número RC-${resultado.numero}. Tienes hasta 15 días hábiles para recibir nuestra respuesta.`,
  };
}

export async function responderReclamoAccion(
  _prev: EstadoFormulario,
  datos: FormData
): Promise<EstadoFormulario> {
  const parsed = z
    .object({ reclamoId: z.string().min(1), respuesta: z.string().min(5, "Escribe la respuesta") })
    .safeParse(Object.fromEntries(datos));

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { ok } = await responderReclamo(parsed.data.reclamoId, parsed.data.respuesta);
  if (!ok) return { error: "No se pudo guardar la respuesta" };

  revalidatePath("/admin/reclamos");
  return { ok: "Respuesta enviada" };
}
