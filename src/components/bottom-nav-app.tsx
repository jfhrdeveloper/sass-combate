"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { navParaRol, esRutaActiva } from "@/config/nav-app";
import { SelectorRolDemo } from "@/components/selector-rol-demo";
import { cn } from "@/utils/cn";
import type { Rol } from "@/config/roles";

/** Los primeros 4 van fijos en la barra; el resto vive detrás de "Más". */
const PRIMARIOS = 4;

interface Props {
  academiaNombre: string;
  rol: Rol;
  haySupabase: boolean;
  roles: readonly Rol[];
  cambiarRolDemo: (formData: FormData) => void;
  sesionNombre: string;
  salir: () => void;
}

/** Reemplaza al sidebar en mobile (SidebarApp se oculta con `md:flex`). */
export function BottomNavApp({
  academiaNombre,
  rol,
  haySupabase,
  roles,
  cambiarRolDemo,
  sesionNombre,
  salir,
}: Props) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);

  const nav = navParaRol(rol);
  const principales = nav.slice(0, PRIMARIOS);
  const resto = nav.slice(PRIMARIOS);
  const masActivo = resto.some((i) => esRutaActiva(pathname, i.href));

  return (
    <>
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-borde bg-panel pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {principales.map(({ href, label, icon: Icon }) => {
          const activo = esRutaActiva(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
                activo ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"
              )}
            >
              <Icon size={20} strokeWidth={activo ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
            abierto || masActivo ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"
          )}
        >
          <Menu size={20} />
          Más
        </button>
      </nav>

      {abierto && (
        <div className="fixed inset-0 z-40 flex flex-col bg-panel md:hidden">
          <div className="flex items-center justify-between border-b border-borde px-4 py-4">
            <p className="font-display text-base font-semibold">{academiaNombre}</p>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar"
              className="rounded-full bg-fondo p-2 text-slate-500 dark:text-slate-400"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 space-y-1 overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {resto.map(({ href, label, icon: Icon }) => {
              const activo = esRutaActiva(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setAbierto(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                    activo
                      ? "bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white"
                      : "text-slate-700 hover:bg-fondo dark:text-slate-200"
                  )}
                >
                  <Icon size={18} className="text-slate-400" />
                  {label}
                </Link>
              );
            })}

            <div className="my-3 h-px bg-borde" />

            {!haySupabase && (
              <div className="mb-3">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Rol (demo)
                </p>
                <SelectorRolDemo accion={cambiarRolDemo} rolActual={rol} roles={roles} />
              </div>
            )}

            <p className="truncate px-3 text-xs text-slate-500 dark:text-slate-400">{sesionNombre}</p>
            <form action={salir}>
              <button
                type="submit"
                className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-fondo dark:text-slate-200"
              >
                <LogOut size={18} className="text-slate-400" />
                Salir
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
