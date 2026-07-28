"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { crearClienteServidor } from "@/lib/supabase/server";
import { HAY_SUPABASE } from "@/lib/datos";

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
  if (!HAY_SUPABASE) redirect("/app");

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
  const { data: academias } = await supabase.from("v_mis_academias").select("id").limit(1);
  const organizacionId = academias?.[0]?.id;
  if (!organizacionId) redirect("/nueva-academia");

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
      rol: z.enum(["admin", "mesa", "juez", "lector"]),
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

const filaLista = z.object({
  nombre: z.string().min(3),
  documento: z.string().regex(/^\d{7,12}$/),
  nacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sexo: z.enum(["M", "F"]),
  peso: z.string(),
  modalidad: z.string().min(2),
});

/**
 * Carga masiva de alumnos por parte del coach.
 *
 * Cada alumno se busca primero en el registro compartido por documento. Si ya
 * existe, se reutiliza su atleta y su récord; si no, se crea.
 */
export async function cargarListaClub(
  _prev: EstadoFormulario,
  datos: FormData
): Promise<EstadoFormulario> {
  const eventoId = String(datos.get("eventoId") ?? "");
  let filas: z.infer<typeof filaLista>[];

  try {
    filas = z.array(filaLista).parse(JSON.parse(String(datos.get("lista") ?? "[]")));
  } catch {
    return { error: "La lista tiene un formato que no se pudo leer" };
  }

  if (filas.length === 0) return { error: "No hay alumnos válidos para inscribir" };

  if (!HAY_SUPABASE) {
    return { ok: `En modo demo no se guarda. Se habrían inscrito ${filas.length}.` };
  }

  const supabase = await crearClienteServidor();
  const { data: academias } = await supabase.from("v_mis_academias").select("id").limit(1);
  const organizacionId = academias?.[0]?.id;
  if (!organizacionId) return { error: "No tienes una academia" };

  const { data: club } = await supabase.from("v_mi_club").select("id").limit(1).maybeSingle();

  let creados = 0;
  for (const f of filas) {
    const [nombres, ...resto] = f.nombre.split(" ");
    const apellidos = resto.join(" ");

    const { data: atleta } = await supabase
      .from("atleta")
      .upsert(
        {
          documento: f.documento,
          nombres,
          apellidos,
          nacimiento: f.nacimiento,
          sexo: f.sexo,
        },
        { onConflict: "documento" }
      )
      .select("id")
      .single();

    const { data: peleador } = await supabase
      .from("peleador")
      .upsert(
        {
          organizacion_id: organizacionId,
          club_id: club?.id ?? null,
          atleta_id: atleta?.id ?? null,
          nombres,
          apellidos,
          documento: f.documento,
          nacimiento: f.nacimiento,
          sexo: f.sexo,
        },
        { onConflict: "organizacion_id,documento" }
      )
      .select("id")
      .single();

    const { data: modalidad } = await supabase
      .from("modalidad")
      .select("id")
      .eq("codigo", f.modalidad)
      .limit(1)
      .maybeSingle();

    if (!peleador || !modalidad) continue;

    const { error } = await supabase.from("inscripcion").upsert(
      {
        organizacion_id: organizacionId,
        evento_id: eventoId,
        peleador_id: peleador.id,
        modalidad_id: modalidad.id,
        peso_declarado: Number(f.peso.replace(",", ".")),
      },
      { onConflict: "evento_id,peleador_id,modalidad_id" }
    );

    if (!error) creados++;
  }

  revalidatePath("/app/mi-club");
  return { ok: `${creados} alumno(s) inscritos` };
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

  const { error } = await supabase.from("pago").insert({
    organizacion_id: organizacionId,
    evento_id: parsed.data.eventoId,
    club_id: club?.id ?? null,
    metodo: parsed.data.metodo,
    monto: parsed.data.monto,
    referencia: parsed.data.referencia || null,
    comprobante_url: comprobanteUrl,
    estado: "en_revision",
  });

  if (error) return { error: "No se pudo registrar el pago" };

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
