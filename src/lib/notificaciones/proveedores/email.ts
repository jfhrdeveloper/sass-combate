export const EMAIL_CONFIGURADO = Boolean(process.env.RESEND_API_KEY);

/** Un fetch a la API REST de Resend; no amerita traer su SDK para un solo endpoint. */
export async function enviarEmail(destino: string, asunto: string, texto: string): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM ?? "notificaciones@sass-combate.com",
      to: destino,
      subject: asunto,
      text: texto,
    }),
  });
  if (!res.ok) throw new Error(`Resend respondió ${res.status}`);
}
