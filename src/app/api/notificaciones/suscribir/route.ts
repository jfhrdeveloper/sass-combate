import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { crearClienteServicio } from "@/lib/supabase/admin";
import { HAY_SUPABASE } from "@/lib/datos";

const esquemaSuscripcion = z.object({
  token: z.string().min(1),
  subscription: z.object({
    endpoint: z.string().min(1),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
});

/**
 * Guarda la suscripción push que el navegador generó en /p/[token].
 *
 * Sin sesión, igual que el resto de esa página: el token del QR ya autoriza
 * ver esa pelea, así que autoriza igual a pedir aviso de ella. Por eso se
 * resuelve y se escribe con `service_role` en vez de depender de RLS de sesión.
 */
export async function POST(req: NextRequest) {
  let cuerpoJson: unknown;
  try {
    cuerpoJson = await req.json();
  } catch {
    return NextResponse.json({ error: "cuerpo no válido" }, { status: 400 });
  }

  const parsed = esquemaSuscripcion.safeParse(cuerpoJson);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { token, subscription } = parsed.data;

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
