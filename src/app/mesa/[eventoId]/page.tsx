"use client";

import { use, useEffect, useState } from "react";
import { Boton } from "@/components/ui/button";
import { Insignia } from "@/components/ui/badge";
import { TarjetaPelea } from "@/components/ui/tarjeta-pelea";
import { BarraConexion, EstadoConexion } from "@/components/estado-conexion";
import { useSincronizacion } from "@/hooks/use-sincronizacion";
import { guardarCache, leerCache } from "@/services/offline-db";
import { AREAS_DEMO, BLOQUES_DEMO, PELEAS_DEMO, inscripcionPorId } from "@/lib/datos";
import { construirAgenda, formatearRetraso, proximasPeleas } from "@/lib/horarios";
import { hora, kg } from "@/utils/format";
import type { Esquina } from "@/types";

const METODOS = ["decision", "rsc", "abandono", "descalificacion", "walkover"];

export default function MesaDeControl({
  params,
}: {
  params: Promise<{ eventoId: string }>;
}) {
  const { eventoId } = use(params);
  const sync = useSincronizacion(eventoId);
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [resueltas, setResueltas] = useState<Record<string, Esquina>>({});

  /** Los resultados ya marcados sobreviven a un cierre de pestaña. */
  useEffect(() => {
    void (async () => {
      const guardadas = await leerCache<Record<string, Esquina>>(`resueltas:${eventoId}`);
      if (guardadas) setResueltas(guardadas);
      await guardarCache(`peleas:${eventoId}`, PELEAS_DEMO);
    })();
  }, [eventoId]);

  const agendas = construirAgenda(AREAS_DEMO, PELEAS_DEMO, BLOQUES_DEMO);
  const proximas = proximasPeleas(agendas, 8).filter((f) => !resueltas[f.id]);
  const retraso = Math.max(...agendas.map((a) => a.retrasoSeg));

  async function registrar(peleaId: string, ganador: Esquina, metodo: string) {
    const nuevas = { ...resueltas, [peleaId]: ganador };
    setResueltas(nuevas);
    setSeleccion(null);
    await guardarCache(`resueltas:${eventoId}`, nuevas);

    const pelea = PELEAS_DEMO.find((p) => p.id === peleaId);
    await sync.registrar("resultado", peleaId, {
      peleaId,
      ganadorId: ganador === "roja" ? pelea?.roja_id : pelea?.azul_id,
      metodo,
      exhibicion: false,
    });
  }

  return (
    <main className="mx-auto max-w-4xl p-4 pb-24">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Mesa de control</h1>
          <p className={`text-sm ${retraso > 600 ? "font-medium text-roja" : "text-slate-500"}`}>
            {formatearRetraso(retraso)}
          </p>
        </div>
        <EstadoConexion
          estado={sync.estado}
          pendientes={sync.pendientes}
          ultimaSync={sync.ultimaSync}
          onReintentar={sync.sincronizar}
        />
      </header>

      <ul className="mt-4 grid gap-3">
        {proximas.map((f) => {
          const p = PELEAS_DEMO.find((x) => x.id === f.id)!;
          const roja = inscripcionPorId(p.roja_id);
          const azul = inscripcionPorId(p.azul_id);
          const area = AREAS_DEMO.find((a) => a.id === p.area_id);
          const abierta = seleccion === p.id;

          return (
            <li key={f.id} className="rounded-xl border border-borde bg-panel p-4">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>
                  {area?.nombre} · pelea {f.orden} · {hora(f.inicio)}
                </span>
                <Insignia estado={f.estado ?? "pendiente"} />
              </div>

              <TarjetaPelea roja={roja?.nombre} azul={azul?.nombre} className="mt-2" />
              <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-slate-500">
                <p className="text-right">
                  {roja?.club} · {kg(roja?.peso_pesaje ?? null)}
                </p>
                <p>
                  {azul?.club} · {kg(azul?.peso_pesaje ?? null)}
                </p>
              </div>

              {!abierta ? (
                <Boton
                  className="mt-3 w-full"
                  tamano="lg"
                  variante="contorno"
                  onClick={() => setSeleccion(p.id)}
                >
                  Registrar resultado
                </Boton>
              ) : (
                <div className="mt-3 grid gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    {(["roja", "azul"] as const).map((esq) => (
                      <div key={esq} className="grid gap-1">
                        <p className="text-center text-xs uppercase text-slate-500">
                          gana {esq}
                        </p>
                        {METODOS.map((m) => (
                          <Boton
                            key={m}
                            variante={esq === "roja" ? "roja" : "azul"}
                            tamano="sm"
                            onClick={() => registrar(p.id, esq, m)}
                          >
                            {m}
                          </Boton>
                        ))}
                      </div>
                    ))}
                  </div>
                  <Boton variante="fantasma" onClick={() => setSeleccion(null)}>
                    Cancelar
                  </Boton>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {proximas.length === 0 && (
        <p className="mt-10 text-center text-slate-500">No quedan peleas pendientes.</p>
      )}

      <BarraConexion
        estado={sync.estado}
        pendientes={sync.pendientes}
        ultimaSync={sync.ultimaSync}
        onReintentar={sync.sincronizar}
      />
    </main>
  );
}
