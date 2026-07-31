import { NextResponse, type NextRequest } from "next/server";
import { crearClienteServicio } from "@/lib/supabase/admin";
import { HAY_SUPABASE } from "@/lib/datos";

/**
 * Guarda la suscripción push que el navegador generó en /p/[token].
 *
 * Sin sesión, igual que el resto de esa página: el token del QR ya autoriza
 * ver esa pelea, así que autoriza igual a pedir aviso de ella. Por eso se
 * resuelve y se escribe con `service_role` en vez de depender de RLS de sesión.
 */
export async function POST(req: NextRequest) {
  let cuerpo: {
    token?: string;
    subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  };
  try {
    cuerpo = await req.json();
  } catch {
    return NextResponse.json({ error: "cuerpo no válido" }, { status: 400 });
  }

  const { token, subscription } = cuerpo;
  if (!token || !subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    return NextResponse.json({ error: "faltan campos" }, { status: 400 });
  }

  if (!HAY_SUPABASE) return NextResponse.json({ ok: true, modo: "demo" });

  const servicio = crearClienteServicio();
  const { data: inscripcion } = await servicio
    .from("inscripcion")
    .select("id")
    .eq("token", token)
    .maybeSingle();
  if (!inscripcion) return NextResponse.json({ error: "token no válido" }, { status: 404 });

  const { error } = await servicio.from("push_suscripcion").upsert(
    {
      inscripcion_id: inscripcion.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: "inscripcion_id,endpoint" }
  );
  if (error) {
    return NextResponse.json({ error: "no se pudo guardar la suscripción" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
