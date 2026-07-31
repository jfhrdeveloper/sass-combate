import webpush from "web-push";
import { envPublico, envServidor } from "@/config/env";

export const PUSH_CONFIGURADO = Boolean(
  envServidor.VAPID_PRIVATE_KEY && envPublico.NEXT_PUBLIC_VAPID_PUBLIC_KEY
);

if (PUSH_CONFIGURADO) {
  webpush.setVapidDetails(
    "mailto:soporte@sass-combate.com",
    envPublico.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    envServidor.VAPID_PRIVATE_KEY!
  );
}

export interface SuscripcionPush {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function enviarPush(
  sub: SuscripcionPush,
  titulo: string,
  cuerpo: string,
  url: string
): Promise<void> {
  await webpush.sendNotification(
    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
    JSON.stringify({ titulo, cuerpo, url })
  );
}
