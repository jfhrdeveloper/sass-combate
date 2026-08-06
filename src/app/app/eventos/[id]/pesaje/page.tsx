"use client";

import { use, useEffect, useMemo, useState } from "react";

import { Campo } from "@/components/ui/input";
import { Boton } from "@/components/ui/button";
import { BarraConexion, EstadoConexion } from "@/components/estado-conexion";
import { useSincronizacion } from "@/hooks/use-sincronizacion";
import { guardarCache, leerCache } from "@/services/offline-db";
import { INSCRIPCIONES_DEMO } from "@/lib/datos";
import { nivelPorPeleas } from "@/lib/nivel";
import { paginar, TAMANO_PAGINA, TAMANO_PAGINA_MOVIL, BREAKPOINT_MOVIL } from "@/lib/paginacion";
import type { Inscripcion } from "@/types";

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
  const [pagina, setPagina] = useState(1);
  const [esMovil, setEsMovil] = useState(false);

  /** Con cientos de inscritos, renderizar todo de una hace pesado el DOM en
   *  un celular de gama baja ringside. La búsqueda ya existía para saltar
   *  directo a alguien; esto acota lo que se renderiza cuando no se busca
   *  (o el resultado sigue siendo largo). Mismo mecanismo que la lista
   *  "sin rival" del emparejador: matchMedia directo, sin cookie, porque
   *  esta pantalla también es 100% cliente. */
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${BREAKPOINT_MOVIL - 1}px)`);
    setEsMovil(mq.matches);
    const escuchar = (e: MediaQueryListEvent) => setEsMovil(e.matches);
    mq.addEventListener("change", escuchar);
    return () => mq.removeEventListener("change", escuchar);
  }, []);

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

  const {
    items: visibles,
    pagina: paginaSegura,
    totalPaginas,
  } = paginar(filtrada, pagina, esMovil ? TAMANO_PAGINA_MOVIL : TAMANO_PAGINA);

  function buscar(valor: string) {
    setBusqueda(valor);
    setPagina(1);
  }

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
          <p className="text-sm text-slate-500 dark:text-slate-400">
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
        onChange={(e) => buscar(e.target.value)}
      />

      <ul className="mt-4 grid gap-2">
        {visibles.map((i) => {
          const peso = pesos[i.id];
          const nivel = nivelPorPeleas(null);
          return (
            <li
              key={i.id}
              className={`rounded-xl border bg-panel p-3 ${
                peso ? "border-exito" : "border-borde"
              }`}
            >
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{i.nombre}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
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
                    <span className="rounded-md bg-exito-suave px-2 py-1 text-xs font-medium text-exito-fuerte">
                      ✓
                    </span>
                  ) : (
                    <span className="w-7" />
                  )}
                </div>
              </div>

              {peso && i.peso_pesaje && Math.abs(peso - i.peso_pesaje) > 2 && (
                <p className="mt-2 rounded-md bg-aviso-suave px-2 py-1 text-xs text-aviso-fuerte">
                  Declaró {i.peso_pesaje} kg y dio {peso} kg. Puede que haya que
                  cambiarlo de categoría.
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {totalPaginas > 1 && (
        <nav aria-label="Paginación" className="mt-4 flex items-center justify-center gap-3 text-sm">
          <Boton
            type="button"
            variante="contorno"
            tamano="sm"
            disabled={paginaSegura <= 1}
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Boton>
          <span className="tabular-nums text-slate-500 dark:text-slate-400">
            Página {paginaSegura} de {totalPaginas}
          </span>
          <Boton
            type="button"
            variante="contorno"
            tamano="sm"
            disabled={paginaSegura >= totalPaginas}
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
          >
            Siguiente
          </Boton>
        </nav>
      )}

      {filtrada.length === 0 && (
        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">Nadie coincide con la búsqueda.</p>
      )}

      <div className="mt-6 rounded-xl border border-borde bg-panel p-4 text-sm text-slate-600 dark:text-slate-300">
        <p className="font-medium text-slate-900 dark:text-white">Puedes pesar sin internet</p>
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
