import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { crearClienteServidor } from "@/lib/supabase/server";
import { CULQI_CONFIGURADO, crearCargoCulqi } from "@/services/pagos/culqi";
import { HAY_SUPABASE } from "@/lib/datos";
import { PRECIO_EVENTO_SOLES, DIAS_EVENTO } from "@/lib/planes";
import { limiteExcedido, ipDelRequest } from "@/utils/rate-limit";

/* Mismo límite que /api/pagos/culqi (10 intentos cada 5 min por IP) — ver
   utils/rate-limit.ts. */
const MAX_INTENTOS = 10;
const VENTANA_MS = 5 * 60 * 1000;

const esquemaEvento = z.object({
  eventoId: z.string().min(1),
  tokenId: z.string().min(1),
  email: z.string().email(),
});

/**
 * Cobra el desbloqueo "Por evento" para UN evento puntual (no la
 * organización completa): a diferencia de /api/pagos/plan (Academia,
 * organización), esto solo levanta el tope de 40 inscritos para el evento
 * indicado. `evento.plan_vence_en` es propio de cada evento — comprarlo de
 * nuevo para otro evento no pisa el vencimiento de este.
 */
export async function POST(req: NextRequest) {
  if (limiteExcedido(`pagos-evento:${ipDelRequest(req)}`, MAX_INTENTOS, VENTANA_MS)) {
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

  const parsed = esquemaEvento.safeParse(cuerpoJson);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { eventoId, tokenId, email } = parsed.data;

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

  // RLS (`evento_escritura`) ya exige dueño/admin/mesa de la organización dueña
  // de este evento — si no matchea, el update de más abajo no afecta filas.
  const { data: evento } = await supabase
    .from("evento")
    .select("id, organizacion_id")
    .eq("id", eventoId)
    .maybeSingle();
  if (!evento) return NextResponse.json({ error: "evento no encontrado" }, { status: 404 });

  let cargo;
  try {
    cargo = await crearCargoCulqi({
      tokenId,
      montoSoles: PRECIO_EVENTO_SOLES,
      email,
      descripcion: "Plan sass-combate: desbloquear evento",
    });
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : "El banco rechazó la tarjeta";
    return NextResponse.json({ error: mensaje }, { status: 402 });
  }

  const venceEn = new Date(Date.now() + DIAS_EVENTO * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from("evento")
    .update({ plan_vence_en: venceEn })
    .eq("id", eventoId);

  if (error) {
    return NextResponse.json(
      {
        error:
          "El cobro se realizó pero no se pudo desbloquear el evento. Contacta soporte con el código " +
          cargo.id,
      },
      { status: 500 }
    );
  }

  // No debe tumbar la respuesta: el evento ya quedó desbloqueado aunque esta fila falle.
  await supabase.from("compra_plan").insert({
    organizacion_id: evento.organizacion_id,
    evento_id: eventoId,
    tipo: "evento",
    monto: PRECIO_EVENTO_SOLES,
    cargo_id: cargo.id,
    vence_en: venceEn,
    creado_por: user.id,
  });

  return NextResponse.json({ ok: true, cargoId: cargo.id, venceEn });
}
