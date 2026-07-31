import { crearClienteServicio } from "@/lib/supabase/admin";
import { EMAIL_CONFIGURADO, enviarEmail } from "./proveedores/email";
import { SMS_CONFIGURADO, WHATSAPP_CONFIGURADO, enviarSms, enviarWhatsapp } from "./proveedores/twilio";
import { PUSH_CONFIGURADO, enviarPush } from "./proveedores/push";

const MINUTOS_AVISO = 15;
const TIPO = "pelea_cerca";

interface Candidato {
  inscripcionId: string;
  token: string;
  nombres: string;
  telefono: string | null;
  email: string | null;
  areaNombre: string;
}

/**
 * Revisa qué peleas están por empezar y avisa al peleador por los canales que
 * tenga disponibles (email, SMS, WhatsApp, push). Se llama después de
 * `recalcular_horarios`: es el único momento en que una hora estimada puede
 * cruzar el umbral de aviso.
 *
 * Idempotente por diseño: `notificacion_enviada` evita reenviar el mismo
 * aviso en el próximo recálculo. Un fallo de un canal no bloquea los demás.
 */
export async function avisarPeleasCercanas(eventoId: string, urlBase: string): Promise<void> {
  if (!EMAIL_CONFIGURADO && !SMS_CONFIGURADO && !WHATSAPP_CONFIGURADO && !PUSH_CONFIGURADO) return;

  const servicio = crearClienteServicio();
  const limite = new Date(Date.now() + MINUTOS_AVISO * 60_000).toISOString();

  const { data: peleas } = await servicio
    .from("pelea")
    .select("id, hora_estimada, area_id, roja_id, azul_id")
    .eq("evento_id", eventoId)
    .in("estado", ["pendiente", "lista"])
    .not("hora_estimada", "is", null)
    .lte("hora_estimada", limite);

  if (!peleas?.length) return;

  const areaIds = [...new Set(peleas.map((p) => p.area_id).filter((x): x is string => Boolean(x)))];
  const inscripcionIds = [
    ...new Set(peleas.flatMap((p) => [p.roja_id, p.azul_id]).filter((x): x is string => Boolean(x))),
  ];
  if (inscripcionIds.length === 0) return;

  const [{ data: areas }, { data: inscripciones }] = await Promise.all([
    servicio.from("area").select("id, nombre").in("id", areaIds),
    servicio
      .from("inscripcion")
      .select("id, token, peleador:peleador_id (nombres, telefono, email)")
      .in("id", inscripcionIds),
  ]);

  type FilaInscripcion = {
    id: string;
    token: string;
    peleador: { nombres: string; telefono: string | null; email: string | null } | null;
  };

  const nombreArea = new Map((areas ?? []).map((a) => [a.id as string, a.nombre as string]));
  const porInscripcion = new Map(
    ((inscripciones ?? []) as unknown as FilaInscripcion[]).map((i) => [i.id, i])
  );

  const candidatos: Candidato[] = [];
  for (const p of peleas) {
    for (const id of [p.roja_id, p.azul_id]) {
      if (!id) continue;
      const insc = porInscripcion.get(id);
      if (!insc?.peleador) continue;
      candidatos.push({
        inscripcionId: id,
        token: insc.token,
        nombres: insc.peleador.nombres,
        telefono: insc.peleador.telefono,
        email: insc.peleador.email,
        areaNombre: nombreArea.get(p.area_id ?? "") ?? "tu área",
      });
    }
  }
  if (candidatos.length === 0) return;

  const { data: yaEnviadas } = await servicio
    .from("notificacion_enviada")
    .select("inscripcion_id, canal")
    .eq("tipo", TIPO)
    .in(
      "inscripcion_id",
      candidatos.map((c) => c.inscripcionId)
    );

  const enviado = new Set((yaEnviadas ?? []).map((n) => `${n.inscripcion_id}:${n.canal}`));

  for (const c of candidatos) {
    const url = `${urlBase}/p/${c.token}`;
    const mensaje = `${c.nombres}, tu pelea en ${c.areaNombre} está por empezar. Preséntate ya: ${url}`;
    const canalesEnviados: string[] = [];

    if (c.email && EMAIL_CONFIGURADO && !enviado.has(`${c.inscripcionId}:email`)) {
      try {
        await enviarEmail(c.email, "Tu pelea está por empezar", mensaje);
        canalesEnviados.push("email");
      } catch {
        // se reintenta solo en el próximo recálculo de horarios
      }
    }

    if (c.telefono && SMS_CONFIGURADO && !enviado.has(`${c.inscripcionId}:sms`)) {
      try {
        await enviarSms(c.telefono, mensaje);
        canalesEnviados.push("sms");
      } catch {
        // idem
      }
    }

    if (c.telefono && WHATSAPP_CONFIGURADO && !enviado.has(`${c.inscripcionId}:whatsapp`)) {
      try {
        await enviarWhatsapp(c.telefono, mensaje);
        canalesEnviados.push("whatsapp");
      } catch {
        // idem
      }
    }

    if (PUSH_CONFIGURADO && !enviado.has(`${c.inscripcionId}:push`)) {
      const { data: subs } = await servicio
        .from("push_suscripcion")
        .select("endpoint, p256dh, auth")
        .eq("inscripcion_id", c.inscripcionId);

      if (subs?.length) {
        for (const s of subs) {
          try {
            await enviarPush(s, "Tu pelea está por empezar", mensaje, url);
          } catch {
            // idem
          }
        }
        canalesEnviados.push("push");
      }
    }

    if (canalesEnviados.length > 0) {
      await servicio.from("notificacion_enviada").upsert(
        canalesEnviados.map((canal) => ({ inscripcion_id: c.inscripcionId, canal, tipo: TIPO })),
        { onConflict: "inscripcion_id,canal,tipo" }
      );
    }
  }
}
