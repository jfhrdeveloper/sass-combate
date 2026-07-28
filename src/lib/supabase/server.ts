import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { CookieOptions } from "@supabase/ssr";

export async function crearClienteServidor() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
