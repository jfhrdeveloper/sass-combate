"use client";

import { useCallback, useEffect, useState } from "react";
import {
  encolar,
  limpiarEnviadas,
  marcarEnviada,
  marcarFallida,
  nuevaClave,
  pendientes,
  type Operacion,
  type TipoOperacion,
} from "@/services/offline-db";

export type EstadoSync = "sin_conexion" | "sincronizando" | "sincronizado" | "con_errores";

const ESPERA_MAX = 30_000;

async function enviar(op: Operacion): Promise<void> {
  const res = await fetch("/api/sincronizar", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": op.clave },
    body: JSON.stringify({ tipo: op.tipo, eventoId: op.eventoId, datos: op.datos }),
  });
  if (!res.ok) throw new Error(`${res.status}`);
}

export function useSincronizacion(eventoId: string) {
  const [enLinea, setEnLinea] = useState(true);
  const [cola, setCola] = useState<Operacion[]>([]);
  const [sincronizando, setSincronizando] = useState(false);
  const [ultimaSync, setUltimaSync] = useState<Date | null>(null);

  const refrescar = useCallback(async () => {
    setCola(await pendientes(eventoId));
  }, [eventoId]);

  useEffect(() => {
    const actualizar = () => setEnLinea(navigator.onLine);
    actualizar();
    void refrescar();
    window.addEventListener("online", actualizar);
    window.addEventListener("offline", actualizar);
    return () => {
      window.removeEventListener("online", actualizar);
      window.removeEventListener("offline", actualizar);
    };
  }, [refrescar]);

  const sincronizar = useCallback(async () => {
    if (!navigator.onLine || sincronizando) return;

    const lista = await pendientes(eventoId);
    if (lista.length === 0) return;

    setSincronizando(true);
    for (const op of lista) {
      if (!op.id) continue;
      try {
        await enviar(op);
        await marcarEnviada(op.id);
      } catch (e) {
        await marcarFallida(op.id, e instanceof Error ? e.message : "error");
      }
    }
    await limpiarEnviadas();
    await refrescar();
    setUltimaSync(new Date());
    setSincronizando(false);
  }, [eventoId, refrescar, sincronizando]);

  /** Intenta al recuperar la conexión y luego con espera creciente. */
  useEffect(() => {
    if (!enLinea) return;
    void sincronizar();

    let espera = 2000;
    let cancelado = false;

    const ciclo = () => {
      if (cancelado) return;
      window.setTimeout(async () => {
        await sincronizar();
        espera = Math.min(espera * 2, ESPERA_MAX);
        ciclo();
      }, espera);
    };
    ciclo();

    return () => {
      cancelado = true;
    };
  }, [enLinea, sincronizar]);

  const registrar = useCallback(
    async (tipo: TipoOperacion, referencia: string, datos: Record<string, unknown>) => {
      await encolar({ clave: nuevaClave(tipo, referencia), tipo, eventoId, datos });
      await refrescar();
      void sincronizar();
    },
    [eventoId, refrescar, sincronizar]
  );

  const conErrores = cola.some((o) => o.intentos >= 3);
  const estado: EstadoSync = !enLinea
    ? "sin_conexion"
    : sincronizando || cola.length > 0
      ? conErrores
        ? "con_errores"
        : "sincronizando"
      : "sincronizado";

  return { estado, enLinea, pendientes: cola.length, ultimaSync, registrar, sincronizar };
}
