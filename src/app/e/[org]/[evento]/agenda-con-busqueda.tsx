"use client";

import { useMemo, useState } from "react";
import { Insignia } from "@/components/ui/badge";
import { TarjetaPelea } from "@/components/ui/tarjeta-pelea";
import { Campo } from "@/components/ui/input";
import { formatearRetraso, type AgendaArea } from "@/lib/horarios";
import { hora } from "@/utils/format";
import type { PeleaPublica } from "@/services/publico";

/**
 * Barra de búsqueda pegajosa (patrón tomado de sass-optica, adaptado): filtra
 * client-side sobre los datos que el servidor ya trajo, sin ida y vuelta al
 * servidor — pensada para alguien buscando su propio nombre desde las
 * gradas, con señal irregular. Los bloques (descansos) se ocultan mientras
 * hay una búsqueda activa, no aportan al filtrar por peleador.
 */
export function AgendaConBusqueda({
  agendas,
  peleas,
}: {
  agendas: AgendaArea[];
  peleas: PeleaPublica[];
}) {
  const [busqueda, setBusqueda] = useState("");
  const filtro = busqueda.trim().toLowerCase();

  const peleasPorId = useMemo(() => new Map(peleas.map((p) => [p.id, p])), [peleas]);

  const coincide = (f: { tipo: string; id: string }) => {
    if (f.tipo === "bloque") return false;
    const p = peleasPorId.get(f.id);
    return p?.roja?.toLowerCase().includes(filtro) || p?.azul?.toLowerCase().includes(filtro);
  };
  const sinResultados = filtro !== "" && !agendas.some((ag) => ag.filas.some(coincide));

  return (
    <>
      <div className="sticky top-0 z-10 -mx-6 bg-fondo/90 px-6 py-3 backdrop-blur">
        <Campo
          placeholder="Buscar un peleador…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {agendas.map((ag) => {
        const filas = filtro ? ag.filas.filter(coincide) : ag.filas;
        if (filtro && filas.length === 0) return null;

        return (
          <section key={ag.area.id} className="mt-8">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-medium">{ag.area.nombre}</h2>
              {!filtro && (
                <span className="text-sm text-slate-500">{formatearRetraso(ag.retrasoSeg)}</span>
              )}
            </div>
            <ul className="mt-3 grid gap-2">
              {filas.map((f) => {
                if (f.tipo === "bloque") {
                  return (
                    <li
                      key={f.id}
                      className="rounded-lg border border-borde bg-aviso-suave px-3 py-2 text-sm text-aviso-fuerte"
                    >
                      {hora(f.inicio)} · {f.nombre}
                    </li>
                  );
                }
                const p = peleasPorId.get(f.id)!;
                return (
                  <li
                    key={f.id}
                    className="flex items-center gap-3 rounded-lg border border-borde bg-panel px-3 py-2"
                  >
                    <span className="w-14 shrink-0 font-display tabular-nums text-slate-600">
                      {hora(f.inicio)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <TarjetaPelea roja={p.roja ?? undefined} azul={p.azul ?? undefined} tamano="sm" />
                      <span className="block text-center text-xs text-slate-500">
                        {p.club_roja} · {p.club_azul}
                      </span>
                    </span>
                    <Insignia estado={f.estado ?? "pendiente"} />
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {sinResultados && (
        <p className="mt-8 text-center text-sm text-slate-500">
          Nadie coincide con &ldquo;{busqueda}&rdquo;.
        </p>
      )}
    </>
  );
}
