"use client";

import { use, useEffect, useMemo, useState } from "react";

import { Campo } from "@/components/ui/input";
import { BarraConexion, EstadoConexion } from "@/components/estado-conexion";
import { useSincronizacion } from "@/lib/offline/sincronizacion";
import { guardarCache, leerCache } from "@/lib/offline/db";
import { INSCRIPCIONES_DEMO } from "@/lib/datos";
import { nivelPorPeleas } from "@/lib/nivel";
import type { Inscripcion } from "@/lib/types";

export default function PaginaPesaje({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const sync = useSincronizacion(id);
  const [lista, setLista] = useState<Inscripcion[]>(INSCRIPCIONES_DEMO);
  const [pesos, setPesos] = useState<Record<string, number>>({});
  const [busqueda, setBusqueda] = useState("");

  /** La lista se guarda en el dispositivo para poder pesar sin señal. */
  useEffect(() => {
    void (async () => {
      const guardada = await leerCache<Inscripcion[]>(`inscripciones:${id}`);
      if (guardada?.length) setLista(guardada);
      else await guardarCache(`inscripciones:${id}`, INSCRIPCIONES_DEMO);

      const pesosGuardados = await leerCache<Record<string, number>>(`pesos:${id}`);
      if (pesosGuardados) setPesos(pesosGuardados);
    })();
  }, [id]);

  const filtrada = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return lista;
    return lista.filter(
      (i) => i.nombre.toLowerCase().includes(q) || i.club.toLowerCase().includes(q)
    );
  }, [lista, busqueda]);

  const pesados = Object.keys(pesos).length;

  async function registrarPeso(inscripcionId: string, valor: string) {
    const peso = Number(valor.replace(",", "."));
    if (!Number.isFinite(peso) || peso <= 0) return;

    const nuevos = { ...pesos, [inscripcionId]: peso };
    setPesos(nuevos);
    await guardarCache(`pesos:${id}`, nuevos);
    await sync.registrar("pesaje", inscripcionId, { inscripcionId, peso });
  }

  return (
    <main className="mx-auto max-w-3xl p-4 pb-24">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Pesaje</h1>
          <p className="text-sm text-slate-500">
            {pesados} de {lista.length} pesados
          </p>
        </div>
        <EstadoConexion
          estado={sync.estado}
          pendientes={sync.pendientes}
          ultimaSync={sync.ultimaSync}
          onReintentar={sync.sincronizar}
        />
      </header>

      <Campo
        className="mt-4"
        placeholder="Buscar por nombre o club…"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <ul className="mt-4 grid gap-2">
        {filtrada.map((i) => {
          const peso = pesos[i.id];
          const nivel = nivelPorPeleas(null);
          return (
            <li
              key={i.id}
              className={`rounded-xl border bg-panel p-3 ${
                peso ? "border-emerald-300" : "border-borde"
              }`}
            >
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{i.nombre}</p>
                  <p className="text-xs text-slate-500">
                    {i.club} · {i.edad ?? "sin edad"} años · nivel {i.nivel ?? nivel}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Campo
                    className="w-24 text-right tabular-nums"
                    inputMode="decimal"
                    placeholder="kg"
                    defaultValue={peso ?? ""}
                    onBlur={(e) => registrarPeso(i.id, e.target.value)}
                  />
                  {peso ? (
                    <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
                      ✓
                    </span>
                  ) : (
                    <span className="w-7" />
                  )}
                </div>
              </div>

              {peso && i.peso_pesaje && Math.abs(peso - i.peso_pesaje) > 2 && (
                <p className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-900">
                  Declaró {i.peso_pesaje} kg y dio {peso} kg. Puede que haya que
                  cambiarlo de categoría.
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {filtrada.length === 0 && (
        <p className="mt-8 text-center text-sm text-slate-500">Nadie coincide con la búsqueda.</p>
      )}

      <div className="mt-6 rounded-xl border border-borde bg-panel p-4 text-sm text-slate-600">
        <p className="font-medium text-slate-900">Puedes pesar sin internet</p>
        <p className="mt-1">
          Todo se guarda en este dispositivo y se envía solo cuando vuelva la
          señal. No cierres la pestaña hasta ver &ldquo;Todo sincronizado&rdquo;.
        </p>
      </div>

      <BarraConexion
        estado={sync.estado}
        pendientes={sync.pendientes}
        ultimaSync={sync.ultimaSync}
        onReintentar={sync.sincronizar}
      />
    </main>
  );
}
