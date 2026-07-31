import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con `service_role`: ignora RLS. Reservado a rutas de servidor que
 * aprueban algo en nombre del sistema (p. ej. un pago con tarjeta que la
 * pasarela ya confirmó), nunca para responder a una lectura/escritura normal
 * del usuario — eso sigue yendo por `crearClienteServidor()`.
 */
export function crearClienteServicio() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
