import { NextResponse, type NextRequest } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";
import { CULQI_CONFIGURADO, crearCargoCulqi } from "@/services/pagos/culqi";
import { HAY_SUPABASE } from "@/lib/datos";
import { PRECIO_EVENTO_SOLES, DIAS_EVENTO } from "@/lib/planes";

/**
 * Cobra el desbloqueo "Por evento" para UN evento puntual (no la
 * organización completa): a diferencia de /api/pagos/plan (Academia,
 * organización), esto solo levanta el tope de 40 inscritos para el evento
 * indicado. `evento.plan_vence_en` es propio de cada evento — comprarlo de
 * nuevo para otro evento no pisa el vencimiento de este.
 */
export async function POST(req: NextRequest) {
  let cuerpo: { eventoId?: string; tokenId?: string; email?: string };
  try {
    cuerpo = await req.json();
  } catch {
    return NextResponse.json({ error: "cuerpo no válido" }, { status: 400 });
  }

  const { eventoId, tokenId, email } = cuerpo;
  if (!eventoId || !tokenId || !email) {
    return NextResponse.json({ error: "faltan campos" }, { status: 400 });
  }

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
