import { envServidor } from "@/config/env";

export const EMAIL_CONFIGURADO = Boolean(envServidor.RESEND_API_KEY);

/** Un fetch a la API REST de Resend; no amerita traer su SDK para un solo endpoint. */
export async function enviarEmail(destino: string, asunto: string, texto: string): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${envServidor.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: envServidor.RESEND_FROM,
      to: destino,
      subject: asunto,
      text: texto,
    }),
  });
  if (!res.ok) throw new Error(`Resend respondió ${res.status}`);
}
