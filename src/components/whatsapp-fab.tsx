"use client";

import { useEffect, useRef, useState } from "react";
import { urlWhatsApp } from "@/config/contacto";
import { WhatsAppIcon } from "@/components/whatsapp-icon";

/**
 * Botón flotante de WhatsApp, solo en la landing. La burbuja hace un ciclo
 * (escribiendo → mensaje → oculto cada 12s) para dar señal de vida sin ser
 * intrusiva; construido con CSS puro (`transition`/`animate-ping` de
 * Tailwind), sin framer-motion — este proyecto no la usa en ningún otro
 * lado. Verde oficial de WhatsApp a propósito, no la paleta roja/azul de
 * marca: el reconocimiento del color es la señal de qué hace el botón.
 */
export function WhatsAppFab() {
  const [fase, setFase] = useState<"escribiendo" | "mensaje" | "oculto">("oculto");
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const ciclo = () => {
      const t1 = setTimeout(() => setFase("escribiendo"), 2000);
      const t2 = setTimeout(() => setFase("mensaje"), 3500);
      const t3 = setTimeout(() => setFase("oculto"), 8000);
      const t4 = setTimeout(ciclo, 12000);
      timeoutsRef.current = [t1, t2, t3, t4];
    };
    ciclo();
    return () => timeoutsRef.current.forEach(clearTimeout);
  }, []);

  const href = urlWhatsApp();
  const abierto = fase !== "oculto";

  return (
    <div className="fixed bottom-8 right-5 z-30 flex flex-row-reverse items-center sm:bottom-10 sm:right-6">
      <div className="relative shrink-0">
        <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-20" aria-hidden />
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Escríbenos por WhatsApp"
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition-transform hover:-translate-y-1 hover:bg-[#1DA851]"
        >
          <WhatsAppIcon size={26} className="translate-x-[1.5px]" />
        </a>
      </div>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-hidden={!abierto}
        tabIndex={abierto ? 0 : -1}
        className={`relative mr-3 flex items-center justify-center overflow-hidden rounded-2xl border border-borde bg-panel px-5 py-3.5 drop-shadow-lg transition-all duration-300 ease-out motion-reduce:transition-none ${
          abierto ? "opacity-100" : "pointer-events-none w-0 scale-95 border-transparent px-0 opacity-0"
        }`}
        style={{ width: abierto ? (fase === "escribiendo" ? "76px" : "220px") : undefined }}
      >
        <span className="absolute -right-[6px] top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 rounded-tr-[2px] border-r border-t border-borde bg-panel" />

        {fase === "escribiendo" ? (
          <span className="relative z-10 flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="block h-1.5 w-1.5 shrink-0 animate-bounce rounded-full bg-slate-400 dark:bg-slate-500"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </span>
        ) : (
          <p className="relative z-10 whitespace-nowrap text-xs font-medium leading-tight sm:text-sm">
            ¿Dudas sobre el sistema?
            <br />
            <span className="font-semibold text-[#25D366]">Escríbenos por WhatsApp 👋</span>
          </p>
        )}
      </a>
    </div>
  );
}
