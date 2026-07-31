import { NextResponse, type NextRequest } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";
import { HAY_SUPABASE } from "@/lib/datos";
import { avisarPeleasCercanas } from "@/services/notificaciones";
import { LIMITE_INSCRITOS_GRATIS, eventoDesbloqueado } from "@/lib/planes";

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

  // El coach solo puede inscribir a su propio club; el resto de operaciones son de mesa.
  const ROLES_POR_TIPO: Record<string, string[]> = {
    resultado: ["dueno", "admin", "mesa"],
    pesaje: ["dueno", "admin", "mesa"],
    asistencia: ["dueno", "admin", "mesa"],
    inscripcion: ["dueno", "admin", "mesa", "coach"],
  };
  const puedeEscribir = (ROLES_POR_TIPO[tipo] ?? []).includes(rol ?? "");
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

        // Un fallo al avisar no debe tumbar el registro del resultado.
        try {
          const urlBase = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
          await avisarPeleasCercanas(eventoId, urlBase);
        } catch {
          // se reintenta solo en el próximo recálculo de horarios
        }
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
        // Coincide con la resolución que antes hacía cargarListaClub: el alumno
        // se busca primero en el registro compartido por documento; si no existe, se crea.
        const fila = datos as {
          nombre: string;
          documento: string;
          nacimiento: string;
          sexo: string;
          peso: string;
          modalidad: string;
          telefono?: string | null;
          email?: string | null;
        };
        const [nombres, ...resto] = fila.nombre.split(" ");
        const apellidos = resto.join(" ");

        const { data: atleta } = await supabase
          .from("atleta")
          .upsert(
            { documento: fila.documento, nombres, apellidos, nacimiento: fila.nacimiento, sexo: fila.sexo },
            { onConflict: "documento" }
          )
          .select("id")
          .single();

        const { data: club } = await supabase.from("v_mi_club").select("id").limit(1).maybeSingle();

        // upsert por organizacion_id+documento: reenviar la misma operación no duplica al peleador.
        // Teléfono/correo son los que llegan con esta inscripción; si no llegan, no se tocan los que ya tenía.
        const { data: peleador } = await supabase
          .from("peleador")
          .upsert(
            {
              organizacion_id: organizacionId,
              club_id: club?.id ?? null,
              atleta_id: atleta?.id ?? null,
              nombres,
              apellidos,
              documento: fila.documento,
              nacimiento: fila.nacimiento,
              sexo: fila.sexo,
              ...(fila.telefono ? { telefono: fila.telefono } : {}),
              ...(fila.email ? { email: fila.email } : {}),
            },
            { onConflict: "organizacion_id,documento" }
          )
          .select("id")
          .single();

        const { data: modalidad } = await supabase
          .from("modalidad")
          .select("id")
          .eq("codigo", fila.modalidad)
          .limit(1)
          .maybeSingle();

        if (!peleador || !modalidad) {
          return NextResponse.json({ error: "peleador o modalidad no encontrados" }, { status: 422 });
        }

        // El plan Gratis cubre hasta 40 inscritos por evento (ver /#precios). Se
        // destraba con el plan Academia (organización completa) o con el
        // desbloqueo puntual de ESTE evento (evento.plan_vence_en) — cualquiera
        // de los dos alcanza. Solo cuenta si la inscripción es nueva: reenviar
        // una ya existente (mismo evento+peleador+modalidad) es una
        // actualización, no debe bloquearse.
        const [{ data: organizacion }, { data: evento }] = await Promise.all([
          supabase.from("organizacion").select("plan, plan_vence_en").eq("id", organizacionId).single(),
          supabase.from("evento").select("plan_vence_en").eq("id", eventoId).single(),
        ]);
        if (
          !eventoDesbloqueado(
            organizacion?.plan ?? null,
            organizacion?.plan_vence_en ?? null,
            evento?.plan_vence_en ?? null
          )
        ) {
          const { data: existente } = await supabase
            .from("inscripcion")
            .select("id")
            .eq("evento_id", eventoId)
            .eq("peleador_id", peleador.id)
            .eq("modalidad_id", modalidad.id)
            .maybeSingle();

          if (!existente) {
            const { count } = await supabase
              .from("inscripcion")
              .select("id", { count: "exact", head: true })
              .eq("evento_id", eventoId);
            if ((count ?? 0) >= LIMITE_INSCRITOS_GRATIS) {
              return NextResponse.json(
                {
                  error: `El plan Gratis cubre hasta ${LIMITE_INSCRITOS_GRATIS} inscritos por evento. Desbloquea este evento desde /app/eventos/${eventoId} para seguir inscribiendo.`,
                },
                { status: 402 }
              );
            }
          }
        }

        // upsert por evento_id+peleador_id+modalidad_id: reenviar la misma operación no duplica la inscripción.
        const { error } = await supabase.from("inscripcion").upsert(
          {
            organizacion_id: organizacionId,
            evento_id: eventoId,
            peleador_id: peleador.id,
            modalidad_id: modalidad.id,
            peso_declarado: Number(fila.peso.replace(",", ".")),
          },
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
