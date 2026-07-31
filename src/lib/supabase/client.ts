"use client";

import { createBrowserClient } from "@supabase/ssr";
import { envPublico } from "@/config/env";

export function crearClienteNavegador() {
  return createBrowserClient(
    envPublico.NEXT_PUBLIC_SUPABASE_URL!,
    envPublico.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
