"use client";

import { useState } from "react";
import { Boton } from "@/components/ui/button";
import { envPublico } from "@/config/env";

const CLAVE_VAPID = envPublico.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function claveComoUint8Array(base64: string): Uint8Array {
  const relleno = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Segura = (base64 + relleno).replace(/-/g, "+").replace(/_/g, "/");
  const binario = atob(base64Segura);
  return Uint8Array.from([...binario].map((c) => c.charCodeAt(0)));
}

/** Suscribe este dispositivo a push web para avisar cuando la pelea se acerque. */
export function ActivarNotificaciones({ token }: { token: string }) {
  const [estado, setEstado] = useState<"inicial" | "activando" | "activado" | "error">("inicial");

  const soportado =
    typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
  if (!CLAVE_VAPID || !soportado) return null;

  async function activar() {
    setEstado("activando");
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setEstado("error");
        return;
      }

      const registro = await navigator.serviceWorker.ready;
      const suscripcion = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: claveComoUint8Array(CLAVE_VAPID!) as BufferSource,
      });

      await fetch("/api/notificaciones/suscribir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, subscription: suscripcion.toJSON() }),
      });

      setEstado("activado");
    } catch {
      setEstado("error");
    }
  }

  if (estado === "activado") {
    return (
      <p className="mt-4 text-center text-sm text-exito-fuerte">
        Listo, te avisamos cuando se acerque tu pelea.
      </p>
    );
  }

  return (
    <div className="mt-4 grid justify-items-center gap-1">
      <Boton
        type="button"
        variante="contorno"
        tamano="sm"
        onClick={activar}
        disabled={estado === "activando"}
      >
        {estado === "activando" ? "Activando…" : "Avisarme cuando se acerque mi pelea"}
      </Boton>
      {estado === "error" && (
        <p className="text-xs text-error-fuerte">
          No se pudo activar. Revisa los permisos de notificaciones del navegador.
        </p>
      )}
    </div>
  );
}
