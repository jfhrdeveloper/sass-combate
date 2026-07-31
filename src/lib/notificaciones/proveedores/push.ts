import webpush from "web-push";

export const PUSH_CONFIGURADO = Boolean(
  process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
);

if (PUSH_CONFIGURADO) {
  webpush.setVapidDetails(
    "mailto:soporte@sass-combate.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
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
