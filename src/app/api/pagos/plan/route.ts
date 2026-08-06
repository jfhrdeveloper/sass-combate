import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { crearClienteServidor } from "@/lib/supabase/server";
import { CULQI_CONFIGURADO, crearCargoCulqi } from "@/services/pagos/culqi";
import { HAY_SUPABASE } from "@/lib/datos";
import { limiteExcedido, ipDelRequest } from "@/utils/rate-limit";

type ClavePlan = "academia_mes" | "academia_anio";

/* Mismo límite que /api/pagos/culqi (10 intentos cada 5 min por IP) — ver
   utils/rate-limit.ts. */
const MAX_INTENTOS = 10;
const VENTANA_MS = 5 * 60 * 1000;

const esquemaPlan = z.object({
  plan: z.enum(["academia_mes", "academia_anio"]),
  tokenId: z.string().min(1),
  email: z.string().email(),
});

/**
 * Cobra el plan Academia de sass-combate (organización completa, no una
 * inscripción de peleador ni un evento puntual — ver /api/pagos/evento para
 * eso) y activa la academia hasta plan_vence_en. Es un cobro único: no hay
 * renovación automática todavía (necesitaría tokens guardados de Culqi y
 * webhooks), así que quien compra debe volver a pagar antes de que venza
 * para seguir en ese plan — ver docs/pending-task.md.
 */
const PLANES: Record<ClavePlan, { monto: number; dias: number; valor: string; nombre: string }> = {
  academia_mes: { monto: 299, dias: 30, valor: "academia", nombre: "Academia (mensual)" },
  academia_anio: { monto: 2990, dias: 365, valor: "academia", nombre: "Academia (anual)" },
};

export async function POST(req: NextRequest) {
  if (limiteExcedido(`pagos-plan:${ipDelRequest(req)}`, MAX_INTENTOS, VENTANA_MS)) {
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

  const parsed = esquemaPlan.safeParse(cuerpoJson);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { plan, tokenId, email } = parsed.data;

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

  const { data: academias } = await supabase
    .from("v_mis_academias")
    .select("id, rol")
    .limit(1);
  const academia = academias?.[0] as { id: string; rol: string } | undefined;
  if (!academia) return NextResponse.json({ error: "sin academia" }, { status: 403 });

  const detalle = PLANES[plan];

  let cargo;
  try {
    cargo = await crearCargoCulqi({
      tokenId,
      montoSoles: detalle.monto,
      email,
      descripcion: `Plan sass-combate: ${detalle.nombre}`,
    });
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : "El banco rechazó la tarjeta";
    return NextResponse.json({ error: mensaje }, { status: 402 });
  }

  const venceEn = new Date(Date.now() + detalle.dias * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from("organizacion")
    .update({ plan: detalle.valor, plan_vence_en: venceEn })
    .eq("id", academia.id);

  if (error) {
    return NextResponse.json(
      {
        error:
          "El cobro se realizó pero no se pudo activar el plan. Contacta soporte con el código " +
          cargo.id,
      },
      { status: 500 }
    );
  }

  // No debe tumbar la respuesta: el plan ya quedó activo aunque esta fila falle.
  await supabase.from("compra_plan").insert({
    organizacion_id: academia.id,
    tipo: plan,
    monto: detalle.monto,
    cargo_id: cargo.id,
    vence_en: venceEn,
    creado_por: user.id,
  });

  return NextResponse.json({ ok: true, cargoId: cargo.id, venceEn });
}
