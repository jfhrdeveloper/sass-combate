"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { COOKIE_ANCHO_PANTALLA, BREAKPOINT_MOVIL } from "@/lib/paginacion";

/**
 * Sin salida visual: solo detecta una vez si la pantalla es de mobile
 * (mismo breakpoint `sm` de Tailwind, 640px) y lo guarda en una cookie para
 * que la paginación del servidor sepa si mostrar 4 u 8 por página sin
 * mandar JavaScript de paginación al cliente (la mecánica sigue siendo
 * `<Paginador>` navegando por `?page=`, ver `src/lib/paginacion.ts`).
 * Si la cookie ya tenía el valor correcto, no hace nada; si cambió (o es la
 * primera visita), refresca para que el Server Component vuelva a paginar.
 */
export function DetectorAncho() {
  const router = useRouter();

  useEffect(() => {
    const esMovil = window.matchMedia(`(max-width: ${BREAKPOINT_MOVIL - 1}px)`).matches;
    const valor = esMovil ? "movil" : "escritorio";
    const actual = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${COOKIE_ANCHO_PANTALLA}=`))
      ?.split("=")[1];

    if (actual !== valor) {
      document.cookie = `${COOKIE_ANCHO_PANTALLA}=${valor}; path=/; max-age=31536000; samesite=lax`;
      router.refresh();
    }
  }, [router]);

  return null;
}
