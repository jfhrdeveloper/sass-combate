"use client";

import { useEffect, useState } from "react";
import { Maximize, Minimize } from "lucide-react";

/**
 * Proyecta la página actual a pantalla completa (Fullscreen API nativa del
 * navegador) — pensado para dejar la agenda o la llave de un evento abiertas
 * en un TV del estadio: sin esto, la barra del navegador se come espacio y
 * nadie la necesita mirando desde lejos. No oculta nada del DOM a mano: la
 * API ya saca el chrome del navegador, que es lo que realmente estorba acá.
 */
export function BotonPantallaCompleta() {
  const [activa, setActiva] = useState(false);
  const [soportada, setSoportada] = useState(false);

  useEffect(() => {
    setSoportada(document.fullscreenEnabled ?? false);
    const onChange = () => setActiva(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  async function alternar() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Algunos navegadores rechazan el pedido (ej. dentro de un iframe sin
      // `allow="fullscreen"`) — no hay nada que el usuario pueda hacer acá.
    }
  }

  if (!soportada) return null;

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={activa ? "Salir de pantalla completa" : "Proyectar en pantalla completa"}
      title={activa ? "Salir de pantalla completa" : "Proyectar en pantalla completa"}
      className="fixed bottom-5 left-5 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-borde bg-panel text-slate-600 shadow-md transition-colors hover:bg-fondo dark:text-slate-300"
    >
      {activa ? <Minimize size={18} /> : <Maximize size={18} />}
    </button>
  );
}
