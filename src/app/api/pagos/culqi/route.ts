import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { crearClienteServidor } from "@/lib/supabase/server";
import { crearClienteServicio } from "@/lib/supabase/admin";
import { CULQI_CONFIGURADO, crearCargoCulqi } from "@/services/pagos/culqi";
import { HAY_SUPABASE } from "@/lib/datos";
import { limiteExcedido, ipDelRequest } from "@/utils/rate-limit";

/* 10 intentos de cargo cada 5 min por IP — un peleador/coach legítimo
   reintentando una tarjeta rechazada no llega ni cerca; corta el loop de un
   script probando tarjetas robadas contra el endpoint. Best-effort, ver
   utils/rate-limit.ts. */
const MAX_INTENTOS = 10;
const VENTANA_MS = 5 * 60 * 1000;

const esquemaCargo = z.object({
  eventoId: z.string().min(1),
  monto: z.number().positive(),
  tokenId: z.string().min(1),
  email: z.string().email(),
});

/**
 * Cobra una inscripción con tarjeta y, si Culqi confirma el cargo, aprueba el
 * pago directo: aquí quien aprueba es la pasarela, no una persona, así que se
 * usa `service_role` para saltar la política que reserva la aprobación a
 * dueño/admin (ver `pago_revision` en supabase/migrations/20260101000005_pagos_y_coach.sql).
 */
export async function POST(req: NextRequest) {
  if (limiteExcedido(`culqi:${ipDelRequest(req)}`, MAX_INTENTOS, VENTANA_MS)) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera unos minutos e intenta de nuevo." },
      { status: 429 }
    );
  }

  let cuerpoJson: unknown;
  try {
    cuerpoJson = await req.json();
  } catch {
    return NextResponse.json({ error: "cuerpo no válido" }, { status: 400 });
  }

  const parsed = esquemaCargo.safeParse(cuerpoJson);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { eventoId, monto, tokenId, email } = parsed.data;

  if (!HAY_SUPABASE) {
    return NextResponse.json({ ok: true, modo: "demo" });
  }

  if (!CULQI_CONFIGURADO) {
    return NextResponse.json(
      { error: "El pago con tarjeta todavía no está configurado" },
      { status: 503 }
    );
  }

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "sin sesión" }, { status: 401 });

  const { data: academias } = await supabase.from("v_mis_academias").select("id").limit(1);
  const organizacionId = academias?.[0]?.id as string | undefined;
  if (!organizacionId) return NextResponse.json({ error: "sin academia" }, { status: 403 });

  const { data: club } = await supabase.from("v_mi_club").select("id").limit(1).maybeSingle();

  let cargo;
  try {
    cargo = await crearCargoCulqi({
      tokenId,
      montoSoles: monto,
      email,
      descripcion: `Inscripciones evento ${eventoId}`,
    });
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : "El banco rechazó la tarjeta";
    return NextResponse.json({ error: mensaje }, { status: 402 });
  }

  // El insert en sí cumple la política normal (estado en_revision, propia
  // organización): va por la sesión, no por service_role.
  const { data: pago, error: errorInsert } = await supabase
    .from("pago")
    .insert({
      organizacion_id: organizacionId,
      evento_id: eventoId,
      club_id: club?.id ?? null,
      creado_por: user.id,
      metodo: "tarjeta",
      monto,
      referencia: cargo.id,
      estado: "en_revision",
    })
    .select("id")
    .single();

  if (errorInsert || !pago) {
    return NextResponse.json(
      { error: "El cobro se realizó pero no se pudo registrar. Contacta soporte con el código " + cargo.id },
      { status: 500 }
    );
  }

  // Vincula las inscripciones pendientes del club antes de aprobar, para que
  // el trigger aplicar_pago las encuentre al pasar a "aprobado".
  await supabase.rpc("vincular_pago_inscripciones", {
    p_pago_id: pago.id,
    p_evento_id: eventoId,
    p_club_id: club?.id ?? null,
  });

  // Aquí sí hace falta service_role: quien aprueba es la pasarela (ya
  // confirmó el cargo), no un dueño/admin, así que se salta pago_revision.
  const servicio = crearClienteServicio();
  await servicio
    .from("pago")
    .update({ estado: "aprobado", revisado_en: new Date().toISOString() })
    .eq("id", pago.id);

  return NextResponse.json({ ok: true, cargoId: cargo.id });
}
