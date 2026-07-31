import type { Metadata } from "next";
import { exigirAcademia, ROLES } from "@/services/auth";
import { salir, cambiarRolDemo } from "@/actions/cuenta";
import { HAY_SUPABASE } from "@/lib/datos";
import { AppShell } from "@/components/app-shell";

// Panel privado de cada academia: nada de esto debe salir en buscadores.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function LayoutPanel({ children }: { children: React.ReactNode }) {
  const { sesion, academia } = await exigirAcademia();

  return (
    <AppShell
      academiaNombre={academia.nombre}
      rol={academia.rol}
      haySupabase={HAY_SUPABASE}
      roles={ROLES}
      cambiarRolDemo={cambiarRolDemo}
      sesionNombre={sesion.nombre ?? sesion.email}
      salir={salir}
    >
      {children}
    </AppShell>
  );
}
