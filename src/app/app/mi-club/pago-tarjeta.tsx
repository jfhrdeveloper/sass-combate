"use client";

import { useState } from "react";
import Script from "next/script";
import { Boton } from "@/components/ui/button";
import { Aviso } from "@/components/ui/formulario";
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

/** Botón de pago con tarjeta: usa el widget Checkout.js de Culqi para tokenizar
 * la tarjeta en el navegador; el número de tarjeta nunca toca este servidor. */
export function PagoTarjeta({
  eventoId,
  monto,
  email,
}: {
  eventoId: string;
  monto: number;
  email: string;
}) {
  const [listo, setListo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [estado, setEstado] = useState<{ error?: string; ok?: string }>({});

  if (!CLAVE_PUBLICA) {
    return (
      <p className="rounded-lg bg-aviso-suave px-3 py-2 text-sm text-aviso-fuerte">
        El pago con tarjeta todavía no está habilitado para esta academia.
      </p>
    );
  }

  async function enviarToken() {
    const token = window.Culqi?.token;
    if (!token) {
      setEstado({ error: window.Culqi?.error?.user_message ?? "No se pudo leer la tarjeta" });
      window.Culqi?.close();
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch("/api/pagos/culqi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventoId, monto, tokenId: token.id, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "El pago no se pudo procesar");
      setEstado({
        ok:
          data.modo === "demo"
            ? "Modo demo: pago simulado, no se cobró nada."
            : "Pago aprobado. Tus inscripciones ya quedaron pagadas.",
      });
    } catch (e) {
      setEstado({ error: e instanceof Error ? e.message : "El pago no se pudo procesar" });
    } finally {
      setEnviando(false);
      window.Culqi?.close();
    }
  }

  function abrir() {
    if (!window.Culqi) return;
    window.culqi = enviarToken;
    window.Culqi.publicKey = CLAVE_PUBLICA!;
    window.Culqi.settings({
      title: "sass-combate",
      currency: "PEN",
      amount: Math.round(monto * 100),
    });
    window.Culqi.open();
  }

  return (
    <div className="grid gap-2">
      <Script src="https://checkout.culqi.com/js/v4" onLoad={() => setListo(true)} />
      <Aviso error={estado.error} ok={estado.ok} />
      <Boton type="button" disabled={!listo || enviando} onClick={abrir}>
        {enviando ? "Procesando…" : `Pagar S/ ${monto.toFixed(2)} con tarjeta`}
      </Boton>
    </div>
  );
}
