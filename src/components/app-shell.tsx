"use client";

import { useEffect, useState } from "react";
import { SidebarApp } from "@/components/sidebar-app";
import { BottomNavApp } from "@/components/bottom-nav-app";
import { cn } from "@/lib/utils";
import type { Rol } from "@/lib/roles";

const CLAVE_COLAPSADO = "app-sidebar-colapsado";

interface Props {
  children: React.ReactNode;
  academiaNombre: string;
  rol: Rol;
  haySupabase: boolean;
  roles: readonly Rol[];
  cambiarRolDemo: (formData: FormData) => void;
  sesionNombre: string;
  salir: () => void;
}

/**
 * Dueño único del estado de colapso del sidebar: así el margen del
 * contenido (`ml-60`/`ml-16`) nunca se desincroniza del ancho real del
 * <aside> (mismo patrón que sass-optica). Arranca expandido y se
 * sincroniza con localStorage en un efecto — no existe en el servidor,
 * así que un colapso guardado tarda un frame en aplicarse (aceptable acá,
 * a diferencia del tema oscuro no hay parpadeo de color en toda la pantalla).
 */
export function AppShell({
  children,
  academiaNombre,
  rol,
  haySupabase,
  roles,
  cambiarRolDemo,
  sesionNombre,
  salir,
}: Props) {
  const [colapsado, setColapsado] = useState(false);

  useEffect(() => {
    setColapsado(window.localStorage.getItem(CLAVE_COLAPSADO) === "1");
  }, []);

  function alternar() {
    const nuevo = !colapsado;
    setColapsado(nuevo);
    window.localStorage.setItem(CLAVE_COLAPSADO, nuevo ? "1" : "0");
  }

  return (
    <div className="min-h-screen">
      <SidebarApp
        colapsado={colapsado}
        onToggle={alternar}
        academiaNombre={academiaNombre}
        rol={rol}
        haySupabase={haySupabase}
        roles={roles}
        cambiarRolDemo={cambiarRolDemo}
        sesionNombre={sesionNombre}
        salir={salir}
      />

      <div className={cn("min-h-screen transition-[margin-left] duration-200", colapsado ? "md:ml-16" : "md:ml-60")}>
        <div className="flex items-center justify-between border-b border-borde px-4 py-3 md:hidden">
          <p className="font-display text-base font-semibold tracking-tight">{academiaNombre}</p>
        </div>

        {!haySupabase && (
          <p className="bg-aviso-suave px-6 py-2 text-center text-sm text-aviso-fuerte">
            Modo demo: sin variables de entorno, los datos son de ejemplo y nada se guarda.
          </p>
        )}

        <div className="pb-20 md:pb-0">{children}</div>
      </div>

      <BottomNavApp
        academiaNombre={academiaNombre}
        rol={rol}
        haySupabase={haySupabase}
        roles={roles}
        cambiarRolDemo={cambiarRolDemo}
        sesionNombre={sesionNombre}
        salir={salir}
      />
    </div>
  );
}
