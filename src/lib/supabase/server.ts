import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { CookieOptions } from "@supabase/ssr";
import { envPublico } from "@/config/env";

export async function crearClienteServidor() {
  const store = await cookies();
  return createServerClient(
    envPublico.NEXT_PUBLIC_SUPABASE_URL!,
    envPublico.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (lista: { name: string; value: string; options: CookieOptions }[]) => {
          try {
            lista.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {
            // Se llama desde un Server Component; el middleware refresca la sesión.
          }
        },
      },
    }
  );
}
