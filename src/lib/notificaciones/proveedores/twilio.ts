export const SMS_CONFIGURADO = Boolean(
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_SMS_FROM
);

export const WHATSAPP_CONFIGURADO = Boolean(
  process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_FROM
);

/** SMS y WhatsApp comparten la misma API de mensajería de Twilio; solo cambia el remitente. */
async function enviarTwilio(from: string, to: string, texto: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
  const cuerpo = new URLSearchParams({ From: from, To: to, Body: texto });

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: cuerpo,
  });
  if (!res.ok) throw new Error(`Twilio respondió ${res.status}`);
}

export function enviarSms(telefono: string, texto: string): Promise<void> {
  return enviarTwilio(process.env.TWILIO_SMS_FROM!, telefono, texto);
}

export function enviarWhatsapp(telefono: string, texto: string): Promise<void> {
  return enviarTwilio(`whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`, `whatsapp:${telefono}`, texto);
}
