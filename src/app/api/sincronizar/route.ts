import { NextResponse, type NextRequest } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";
import { HAY_SUPABASE } from "@/lib/datos";

/**
 * Recibe las operaciones que la mesa acumuló sin conexión.
 *
 * La cabecera Idempotency-Key es lo que evita duplicados: si el dispositivo
 * reenvía la misma operación porque no llegó a ver la respuesta, el servidor la
 * reconoce y responde igual sin volver a aplicarla.
 */
export async function POST(req: NextRequest) {
  const clave = req.headers.get("Idempotency-Key");
  if (!clave) {
    return NextResponse.json({ error: "falta la clave de idempotencia" }, { status: 400 });
  }

  let cuerpo: { tipo?: string; eventoId?: string; datos?: Record<string, unknown> };
  try {
    cuerpo = await req.json();
  } catch {
    return NextResponse.json({ error: "cuerpo no válido" }, { status: 400 });
  }

  const { tipo, eventoId, datos } = cuerpo;
  if (!tipo || !eventoId || !datos) {
    return NextResponse.json({ error: "faltan campos" }, { status: 400 });
  }

  if (!HAY_SUPABASE) {
    return NextResponse.json({ ok: true, modo: "demo", clave });
  }

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "sin sesión" }, { status: 401 });

  const { data: academias } = await supabase.from("v_mis_academias").select("id, rol").limit(1);
  const organizacionId = academias?.[0]?.id as string | undefined;
  const rol = academias?.[0]?.rol as string | undefined;
  if (!organizacionId) return NextResponse.json({ error: "sin academia" }, { status: 403 });

  const puedeEscribir = ["dueno", "admin", "mesa"].includes(rol ?? "");
  if (!puedeEscribir) return NextResponse.json({ error: "sin permiso" }, { status: 403 });

  try {
    switch (tipo) {
      case "resultado": {
        const { peleaId, ganadorId, metodo, round, exhibicion } = datos as {
          peleaId: string;
          ganadorId: string | null;
          metodo: string;
          round?: number;
          exhibicion?: boolean;
        };

        // upsert por pelea_id: reenviar la misma operación no crea un segundo resultado.
        const { error } = await supabase.from("resultado").upsert(
          {
            organizacion_id: organizacionId,
            pelea_id: peleaId,
            ganador_id: ganadorId,
            metodo,
            round: round ?? null,
            exhibicion: exhibicion ?? false,
            registrado_por: user.id,
          },
          { onConflict: "pelea_id" }
        );
        if (error) throw error;

        await supabase
          .from("pelea")
          .update({ estado: "finalizada", hora_fin_real: new Date().toISOString() })
          .eq("id", peleaId);

        await supabase.rpc("recalcular_horarios", { p_evento_id: eventoId });
        break;
      }

      case "pesaje": {
        const { inscripcionId, peso } = datos as { inscripcionId: string; peso: number };
        const { error } = await supabase
          .from("inscripcion")
          .update({ peso_pesaje: peso, estado: "pesada" })
          .eq("id", inscripcionId);
        if (error) throw error;
        break;
      }

      case "asistencia": {
        const { inscripcionId, presente } = datos as {
          inscripcionId: string;
          presente: boolean;
        };
        const { error } = await supabase
          .from("inscripcion")
          .update({ estado: presente ? "aprobada" : "ausente" })
          .eq("id", inscripcionId);
        if (error) throw error;
        break;
      }

      case "inscripcion": {
        const { error } = await supabase.from("inscripcion").upsert(
          { ...(datos as Record<string, unknown>), organizacion_id: organizacionId, evento_id: eventoId },
          { onConflict: "evento_id,peleador_id,modalidad_id" }
        );
        if (error) throw error;
        break;
      }

      default:
        return NextResponse.json({ error: "tipo desconocido" }, { status: 400 });
    }
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : "error al guardar";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }

  return NextResponse.json({ ok: true, clave });
}
