import { z } from "zod";

/**
 * Todas las variables del proyecto son opcionales a propósito: sin ellas, la
 * pieza que dependen queda inactiva o en modo demo (`HAY_SUPABASE`,
 * `CULQI_CONFIGURADO`, etc.) en vez de romper el arranque — ver
 * docs/pending-task.md. Por eso esto valida FORMATO cuando la variable está
 * presente, no que exista; no es un "falla si falta X" al estilo de un
 * server tradicional.
 *
 * Separado en dos objetos porque mezclarlos importaría secretos de servidor
 * en el bundle del cliente: `envPublico` es seguro de importar desde
 * componentes "use client" (Next.js reemplaza `process.env.NEXT_PUBLIC_*`
 * de forma estática en cada archivo que lo referencia, incluido este
 * módulo); `envServidor` NUNCA debe importarse desde un componente cliente.
 */
const esquemaPublico = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_CULQI_PUBLIC_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_DOMINIO_RAIZ: z.string().min(1).default("localhost:3000"),
});

export const envPublico = esquemaPublico.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_CULQI_PUBLIC_KEY: process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY,
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  NEXT_PUBLIC_DOMINIO_RAIZ: process.env.NEXT_PUBLIC_DOMINIO_RAIZ,
});

const esquemaServidor = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  CULQI_SECRET_KEY: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM: z.string().min(1).default("notificaciones@sass-combate.com"),
  TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
  TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
  TWILIO_SMS_FROM: z.string().min(1).optional(),
  TWILIO_WHATSAPP_FROM: z.string().min(1).optional(),
  VAPID_PRIVATE_KEY: z.string().min(1).optional(),
});

/**
 * Solo importar desde código de servidor (Server Components, Server Actions,
 * Route Handlers) — nunca desde un componente "use client".
 *
 * Cada integración sigue siendo dueña de su propia bandera `_CONFIGURADO`
 * (`CULQI_CONFIGURADO` en pagos/culqi.ts, `EMAIL_CONFIGURADO` en
 * notificaciones/proveedores/email.ts, etc.), derivada de `envPublico`/
 * `envServidor` — no se duplica acá para no tener dos fuentes de verdad.
 */
export const envServidor = esquemaServidor.parse({
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  CULQI_SECRET_KEY: process.env.CULQI_SECRET_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM: process.env.RESEND_FROM,
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_SMS_FROM: process.env.TWILIO_SMS_FROM,
  TWILIO_WHATSAPP_FROM: process.env.TWILIO_WHATSAPP_FROM,
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
});
