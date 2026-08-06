"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, LogOut } from "lucide-react";
import { navParaRol, esRutaActiva } from "@/config/nav-app";
import { SelectorRolDemo } from "@/components/selector-rol-demo";
import { cn } from "@/utils/cn";
import type { Rol } from "@/config/roles";

interface Props {
  colapsado: boolean;
  onToggle: () => void;
  academiaNombre: string;
  rol: Rol;
  haySupabase: boolean;
  roles: readonly Rol[];
  cambiarRolDemo: (formData: FormData) => void;
  sesionNombre: string;
  salir: () => void;
}

/**
 * Sidebar fijo de escritorio. El estado de colapso vive en AppShell (dueño
 * único), este componente es puramente presentacional respecto a eso —
 * así el ancho real del <aside> y el margen del contenido nunca se
 * desincronizan (mismo patrón que sass-optica).
 */
export function SidebarApp({
  colapsado,
  onToggle,
  academiaNombre,
  rol,
  haySupabase,
  roles,
  cambiarRolDemo,
  sesionNombre,
  salir,
}: Props) {
  const pathname = usePathname();
  const nav = navParaRol(rol);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-borde bg-panel transition-[width] duration-200 md:flex",
        colapsado ? "w-16" : "w-60"
      )}
    >
      <div className="flex items-center justify-between gap-1 border-b border-borde px-3 py-4">
        {!colapsado && (
          <Link href="/app" className="truncate pl-1 font-display text-base font-semibold tracking-tight">
            {academiaNombre}
          </Link>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-label={colapsado ? "Expandir menú" : "Colapsar menú"}
          title={colapsado ? "Expandir menú" : "Colapsar menú"}
          className={cn(
            "flex items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-fondo hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200",
            colapsado && "w-full"
          )}
        >
          {colapsado ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden px-2 py-4">
        {nav.map(({ href, label, icon: Icon }) => {
          const activo = esRutaActiva(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              title={colapsado ? label : undefined}
              aria-current={activo ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                colapsado && "justify-center",
                activo
                  ? "bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white"
                  : "text-slate-600 hover:bg-fondo dark:text-slate-300 dark:hover:bg-white/5"
              )}
            >
              <Icon size={18} strokeWidth={activo ? 2.5 : 2} />
              {!colapsado && label}
            </Link>
          );
        })}
      </nav>

      {!haySupabase && (
        <div className="border-t border-borde px-3 py-3">
          {colapsado ? (
            <p className="text-center text-[10px] font-semibold uppercase text-slate-400 dark:text-slate-500" title={`Rol demo: ${rol}`}>
              {rol.slice(0, 3)}
            </p>
          ) : (
            <>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Rol (demo)
              </p>
              <SelectorRolDemo accion={cambiarRolDemo} rolActual={rol} roles={roles} />
            </>
          )}
        </div>
      )}

      <div className={cn("border-t border-borde px-3 py-3", colapsado && "flex flex-col items-center")}>
        {!colapsado && (
          <p className="mb-2 truncate text-xs text-slate-500 dark:text-slate-400" title={sesionNombre}>
            {sesionNombre}
          </p>
        )}
        <form action={salir}>
          <button
            type="submit"
            title="Salir"
            className={cn(
              "flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-fondo hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
              colapsado && "justify-center"
            )}
          >
            <LogOut size={15} />
            {!colapsado && "Salir"}
          </button>
        </form>
      </div>
    </aside>
  );
}
