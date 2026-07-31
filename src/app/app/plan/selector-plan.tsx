"use client";

import { useState } from "react";
import Script from "next/script";
import { Boton } from "@/components/ui/button";
import { Aviso } from "@/components/ui/formulario";

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

const CLAVE_PUBLICA = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY;

const OPCIONES = [
  { clave: "academia_mes", nombre: "Academia · mensual", monto: 299 },
  { clave: "academia_anio", nombre: "Academia · anual", monto: 2990 },
] as const;

/**
 * Cobro único del plan Academia (organización completa, no una inscripción).
 * El desbloqueo "Por evento" ya no vive acá — se compra desde el evento
 * puntual que se quiere desbloquear (ver /app/eventos/[id]).
 */
export function SelectorPlan({ email }: { email: string }) {
  const [listo, setListo] = useState(false);
  const [comprando, setComprando] = useState<string | null>(null);
  const [estado, setEstado] = useState<{ error?: string; ok?: string }>({});

  if (!CLAVE_PUBLICA) {
    return (
      <p className="rounded-lg bg-aviso-suave px-3 py-2 text-sm text-aviso-fuerte">
        El pago con tarjeta todavía no está habilitado para comprar un plan.
      </p>
    );
  }

  async function enviarToken(clave: string) {
    const token = window.Culqi?.token;
    if (!token) {
      setEstado({ error: window.Culqi?.error?.user_message ?? "No se pudo leer la tarjeta" });
      window.Culqi?.close();
      setComprando(null);
      return;
    }

    try {
      const res = await fetch("/api/pagos/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: clave, tokenId: token.id, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "El pago no se pudo procesar");
      setEstado({
        ok:
          data.modo === "demo"
            ? "Modo demo: pago simulado, no se cobró nada."
            : "Plan activado. Recarga la página para ver el nuevo vencimiento.",
      });
    } catch (e) {
      setEstado({ error: e instanceof Error ? e.message : "El pago no se pudo procesar" });
    } finally {
      setComprando(null);
      window.Culqi?.close();
    }
  }

  function abrir(op: (typeof OPCIONES)[number]) {
    if (!window.Culqi) return;
    setComprando(op.clave);
    window.culqi = () => enviarToken(op.clave);
    window.Culqi.publicKey = CLAVE_PUBLICA!;
    window.Culqi.settings({
      title: "sass-combate",
      currency: "PEN",
      amount: Math.round(op.monto * 100),
    });
    window.Culqi.open();
  }

  return (
    <div className="grid gap-3">
      <Script src="https://checkout.culqi.com/js/v4" onLoad={() => setListo(true)} />
      <Aviso error={estado.error} ok={estado.ok} />
      <div className="grid gap-2 sm:grid-cols-3">
        {OPCIONES.map((op) => (
          <Boton
            key={op.clave}
            type="button"
            variante="contorno"
            disabled={!listo || comprando !== null}
            onClick={() => abrir(op)}
          >
            {comprando === op.clave ? "Procesando…" : `${op.nombre} · S/ ${op.monto}`}
          </Boton>
        ))}
      </div>
    </div>
  );
}
