"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { crearReclamo, responderReclamo } from "@/services/reclamos";
import type { EstadoFormulario } from "./estado";
export type { EstadoFormulario } from "./estado";

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
