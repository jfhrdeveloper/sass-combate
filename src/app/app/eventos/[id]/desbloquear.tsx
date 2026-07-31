"use client";

import { useState } from "react";
import Script from "next/script";
import { Boton } from "@/components/ui/button";
import { Aviso } from "@/components/ui/formulario";
import { fechaLarga } from "@/utils/format";
import { PRECIO_EVENTO_SOLES } from "@/lib/planes";
import { envPublico } from "@/config/env";

declare global {
  interface Window {
    Culqi?: {
      publicKey: string;
      settings: (s: Record<string, unknown>) => void;
      open: () => void;
      close: () => void;
      token?: { id: string };
      error?: { user_message: string };
    };
    culqi?: () => void;
  }
}

const CLAVE_PUBLICA = envPublico.NEXT_PUBLIC_CULQI_PUBLIC_KEY;

interface Props {
  eventoId: string;
  email: string;
  /** true si el plan Academia (organización completa) ya cubre este evento. */
  cubiertoPorAcademia: boolean;
  /** Vencimiento propio del evento (`evento.plan_vence_en`), si ya está vigente. */
  venceEn: string | null;
}

/**
 * A diferencia de SelectorPlan (plan Academia, organización completa), esto
 * desbloquea solo ESTE evento: levanta el tope de 40 inscritos sin pisar el
 * vencimiento de ningún otro evento de la academia.
 */
export function DesbloquearEvento({ eventoId, email, cubiertoPorAcademia, venceEn }: Props) {
  const [listo, setListo] = useState(false);
  const [comprando, setComprando] = useState(false);
  const [estado, setEstado] = useState<{ error?: string; ok?: string }>({});

  const vigente = Boolean(venceEn && new Date(venceEn) > new Date());

  if (cubiertoPorAcademia) {
    return (
      <p className="rounded-lg bg-exito-suave px-3 py-2 text-sm text-exito-fuerte">
        Cubierto por tu plan Academia — sin tope de inscritos.
      </p>
    );
  }

  if (vigente) {
    return (
      <p className="rounded-lg bg-exito-suave px-3 py-2 text-sm text-exito-fuerte">
        Evento desbloqueado hasta {fechaLarga(venceEn!)} — sin tope de inscritos.
      </p>
    );
  }

  if (!CLAVE_PUBLICA) {
    return (
      <p className="rounded-lg bg-aviso-suave px-3 py-2 text-sm text-aviso-fuerte">
        El pago con tarjeta todavía no está habilitado para desbloquear eventos.
      </p>
    );
  }

  async function enviarToken() {
    const token = window.Culqi?.token;
    if (!token) {
      setEstado({ error: window.Culqi?.error?.user_message ?? "No se pudo leer la tarjeta" });
      window.Culqi?.close();
      setComprando(false);
      return;
    }

    try {
      const res = await fetch("/api/pagos/evento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventoId, tokenId: token.id, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "El pago no se pudo procesar");
      setEstado({
        ok:
          data.modo === "demo"
            ? "Modo demo: pago simulado, no se cobró nada."
            : "Evento desbloqueado. Recarga la página para ver el nuevo vencimiento.",
      });
    } catch (e) {
      setEstado({ error: e instanceof Error ? e.message : "El pago no se pudo procesar" });
    } finally {
      setComprando(false);
      window.Culqi?.close();
    }
  }

  function abrir() {
    if (!window.Culqi) return;
    setComprando(true);
    window.culqi = enviarToken;
    window.Culqi.publicKey = CLAVE_PUBLICA!;
    window.Culqi.settings({
      title: "sass-combate",
      currency: "PEN",
      amount: Math.round(PRECIO_EVENTO_SOLES * 100),
    });
    window.Culqi.open();
  }

  return (
    <div className="grid gap-2">
      <Script src="https://checkout.culqi.com/js/v4" onLoad={() => setListo(true)} />
      <Aviso error={estado.error} ok={estado.ok} />
      <Boton type="button" variante="contorno" disabled={!listo || comprando} onClick={abrir}>
        {comprando ? "Procesando…" : `Desbloquear este evento · S/ ${PRECIO_EVENTO_SOLES}`}
      </Boton>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        El plan Gratis cubre hasta 40 inscritos en este evento. Desbloquearlo quita
        ese tope por {" "}
        <span className="font-medium">45 días</span> — solo para este evento, no
        para toda la academia.
      </p>
    </div>
  );
}
