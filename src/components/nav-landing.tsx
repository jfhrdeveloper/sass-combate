"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { estilos } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/utils/cn";

const ENLACES = [
  { href: "/#inicio", label: "Inicio", id: "inicio" },
  { href: "/#como-funciona", label: "Cómo funciona", id: "como-funciona" },
  { href: "/#precios", label: "Precios", id: "precios" },
  { href: "/#faq", label: "FAQ", id: "faq" },
] as const;

/**
 * Header flotante tipo "píldora" (patrón tomado de sass-optica, adaptado a
 * los tokens y tipografía ya elegidos acá — sin framer-motion, que este
 * proyecto no usa en ningún otro lado):
 *
 * - `fixed`, no `sticky`: flota SOBRE el contenido desde el primer scroll,
 *   sin ocupar espacio en el flujo — por eso el hero de page.tsx lleva
 *   `pt-28` en vez de un padding-top normal de header.
 * - Transparente arriba → al bajar gana fondo `bg-panel/80` + blur + sombra
 *   y se cierra en píldora (`rounded-full`).
 * - Sección activa marcada por scroll-spy (IntersectionObserver), como en
 *   el sidebar de /app (ver esRutaActiva en nav-app.ts), pero acá la
 *   "ruta" es la sección visible de una sola página con anclas.
 */
export function NavLanding() {
  const [scrolleado, setScrolleado] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [activo, setActivo] = useState<string | null>("inicio");
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function onScroll() {
      setScrolleado(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const secciones = ENLACES.map((l) => document.getElementById(l.id)).filter(
      (el): el is HTMLElement => el !== null
    );
    if (secciones.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActivo(visible.target.id);
      },
      { rootMargin: "-30% 0px -55% 0px" }
    );
    secciones.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuAbierto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuAbierto]);

  useEffect(() => {
    function onClickFuera(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setMenuAbierto(false);
    }
    document.addEventListener("mousedown", onClickFuera);
    return () => document.removeEventListener("mousedown", onClickFuera);
  }, []);

  const cerrar = () => setMenuAbierto(false);

  const claseLink = (id: string) =>
    cn(
      "rounded-full px-4 py-2 text-sm font-medium transition-colors",
      activo === id
        ? "bg-fondo font-semibold text-slate-900 dark:bg-white/10 dark:text-white"
        : "text-slate-600 hover:bg-fondo hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
    );

  return (
    <nav ref={navRef} className="fixed inset-x-0 top-0 z-40" aria-label="Navegación principal">
      {/* ====== Desktop — píldora flotante ====== */}
      <div
        className={cn(
          "hidden w-full justify-center transition-[padding] duration-500 ease-in-out sm:flex",
          scrolleado ? "pt-4" : "pt-6"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-1 transition-all duration-500 ease-in-out",
            scrolleado
              ? "rounded-full border border-borde bg-panel/80 px-5 py-2.5 shadow-md shadow-black/[0.08] backdrop-blur-xl"
              : "border border-transparent bg-transparent px-4 py-2"
          )}
        >
          <Link href="/" className="mr-5 shrink-0 font-display text-lg font-semibold tracking-tight">
            sass-combate
          </Link>

          <div
            className={cn(
              "mr-5 h-5 w-px bg-borde transition-opacity duration-300",
              scrolleado ? "opacity-100" : "opacity-0"
            )}
          />

          <div className="flex items-center gap-0.5">
            {ENLACES.map((l) => (
              <Link key={l.href} href={l.href} className={claseLink(l.id)}>
                {l.label}
              </Link>
            ))}
          </div>

          <div className="mx-4 h-5 w-px bg-borde" />

          <div className="flex items-center gap-2">
            <div className="scale-90">
              <ThemeToggle />
            </div>
            <Link
              href="/entrar"
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-fondo hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
            >
              Entrar
            </Link>
            <Link href="/registro" className={cn(estilos({ tamano: "sm" }), "rounded-full")}>
              Crear cuenta
            </Link>
          </div>
        </div>
      </div>

      {/* ====== Mobile — píldora + hamburguesa ====== */}
      <div
        className={cn(
          "flex w-full justify-center transition-all duration-500 ease-in-out sm:hidden",
          scrolleado ? "pt-4" : "pt-0"
        )}
      >
        <div
          className={cn(
            "flex w-full items-center transition-all duration-500 ease-in-out",
            scrolleado
              ? "mx-3 rounded-full border border-borde bg-panel/80 px-4 shadow-md shadow-black/[0.08] backdrop-blur-xl"
              : "border border-transparent bg-transparent px-6"
          )}
        >
          <Link href="/" className="flex-1 font-display text-lg font-semibold tracking-tight">
            sass-combate
          </Link>
          <div className={cn("flex items-center gap-1 transition-all duration-500", scrolleado ? "h-14" : "h-16")}>
            <div className="scale-90">
              <ThemeToggle />
            </div>
            <button
              type="button"
              onClick={() => setMenuAbierto((v) => !v)}
              aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuAbierto}
              className="p-2 text-slate-700 dark:text-slate-200"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
                {menuAbierto ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ====== Overlay + panel lateral (mobile) ====== */}
      <div
        onClick={cerrar}
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 sm:hidden",
          menuAbierto ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-[80vw] max-w-[320px] flex-col bg-panel shadow-2xl transition-transform duration-300 ease-in-out sm:hidden",
          menuAbierto ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-borde px-5">
          <span className="font-display text-lg font-semibold tracking-tight">sass-combate</span>
          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar menú"
            className="rounded-full bg-fondo p-2 text-slate-500 transition-colors hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-white/10"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
          {ENLACES.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={cerrar}
              className={cn(
                "rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                activo === l.id
                  ? "bg-fondo font-semibold text-slate-900 dark:bg-white/10 dark:text-white"
                  : "text-slate-700 hover:bg-fondo dark:text-slate-200 dark:hover:bg-white/5"
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t border-borde p-4 pb-8">
          <Link
            href="/entrar"
            onClick={cerrar}
            className={cn(estilos({ variante: "contorno", tamano: "md" }), "w-full rounded-full")}
          >
            Entrar
          </Link>
          <Link href="/registro" onClick={cerrar} className={cn(estilos({ tamano: "md" }), "w-full rounded-full")}>
            Crear cuenta
          </Link>
        </div>
      </div>
    </nav>
  );
}
