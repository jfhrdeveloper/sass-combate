"use client";

import Link from "next/link";
import { useState } from "react";
import { estilos } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const ENLACES = [
  ["Cómo funciona", "/#como-funciona"],
  ["Precios", "/#precios"],
  ["FAQ", "/#faq"],
  ["Evento de ejemplo", "/e/kick1/contender-2026"],
] as const;

export function NavLanding() {
  const [abierto, setAbierto] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-borde bg-panel/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-3">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight">
          sass-combate
        </Link>

        <nav className="ml-2 hidden gap-6 text-sm font-medium text-slate-600 dark:text-slate-300 sm:flex">
          {ENLACES.map(([texto, href]) => (
            <Link key={href} href={href} className="hover:text-slate-900 dark:hover:text-white">
              {texto}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 sm:flex">
          <ThemeToggle />
          <Link
            href="/entrar"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            Entrar
          </Link>
          <Link href="/registro" className={estilos({ tamano: "sm" })}>
            Crear cuenta
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:hidden">
          <ThemeToggle />
          <button
            type="button"
            aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={abierto}
            onClick={() => setAbierto(!abierto)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-borde bg-panel text-slate-600 dark:text-slate-300"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              {abierto ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {abierto && (
        <nav className="grid gap-4 border-t border-borde px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300 sm:hidden">
          {ENLACES.map(([texto, href]) => (
            <Link key={href} href={href} onClick={() => setAbierto(false)}>
              {texto}
            </Link>
          ))}
          <Link href="/entrar" onClick={() => setAbierto(false)}>
            Entrar
          </Link>
          <Link
            href="/registro"
            onClick={() => setAbierto(false)}
            className={cn(estilos({ tamano: "sm" }), "w-full")}
          >
            Crear cuenta
          </Link>
        </nav>
      )}
    </header>
  );
}
