import { createClient } from "@supabase/supabase-js";
import { envPublico, envServidor } from "@/config/env";

/**
 * Cliente con `service_role`: ignora RLS. Reservado a rutas de servidor que
 * aprueban algo en nombre del sistema (p. ej. un pago con tarjeta que la
 * pasarela ya confirmó), nunca para responder a una lectura/escritura normal
 * del usuario — eso sigue yendo por `crearClienteServidor()`.
 */
export function crearClienteServicio() {
  return createClient(
    envPublico.NEXT_PUBLIC_SUPABASE_URL!,
    envServidor.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
