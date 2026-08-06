"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { crearClienteServidor } from "@/lib/supabase/server";
import { HAY_SUPABASE } from "@/lib/datos";
import type { EstadoFormulario } from "./estado";
export type { EstadoFormulario } from "./estado";

export async function registrarPago(
  _prev: EstadoFormulario,
  datos: FormData
): Promise<EstadoFormulario> {
  const parsed = z
    .object({
      eventoId: z.string().min(1),
      metodo: z.enum(["yape", "plin", "transferencia", "efectivo"]),
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

const esquemaRevision = z
  .object({
    pagoId: z.string().min(1),
    decision: z.enum(["aprobado", "rechazado"]),
    motivo: z.string().optional(),
    descuentoTipo: z.enum(["monto", "porcentaje", ""]).optional(),
    descuentoValor: z.coerce.number().min(0).optional().or(z.literal("")),
  })
  .refine((d) => !(d.descuentoTipo === "porcentaje" && Number(d.descuentoValor) > 100), {
    message: "El descuento no puede pasar de 100%",
    path: ["descuentoValor"],
  });

export async function revisarPago(
  _prev: EstadoFormulario,
  datos: FormData
): Promise<EstadoFormulario> {
  const parsed = esquemaRevision.safeParse(Object.fromEntries(datos));

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos incompletos" };
  if (!HAY_SUPABASE) return { ok: "En modo demo no se revisa." };

  const { descuentoTipo, descuentoValor } = parsed.data;
  const hayDescuento = !!descuentoTipo && descuentoValor !== undefined && descuentoValor !== "";

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("pago")
    .update({
      estado: parsed.data.decision,
      motivo_rechazo: parsed.data.decision === "rechazado" ? parsed.data.motivo : null,
      descuento_tipo: hayDescuento ? descuentoTipo : null,
      descuento_valor: hayDescuento ? Number(descuentoValor) : null,
      revisado_por: user?.id ?? null,
      revisado_en: new Date().toISOString(),
    })
    .eq("id", parsed.data.pagoId);

  if (error) return { error: "No se pudo actualizar el pago" };

  revalidatePath("/app/pagos");
  return { ok: parsed.data.decision === "aprobado" ? "Pago aprobado" : "Pago rechazado" };
}
