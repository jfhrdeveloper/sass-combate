import { Insignia } from "@/components/ui/badge";
import { TarjetaPelea } from "@/components/ui/tarjeta-pelea";
import type { PeleaPublica } from "@/services/publico";

/**
 * Árbol de eliminación directa (MMA), agrupado por ronda en columnas con
 * scroll horizontal — pensado mobile-first: en un celular en las gradas, un
 * árbol gráfico con líneas conectoras obliga a hacer zoom para leer los
 * nombres; columnas verticales por ronda (con más separación cuanto más
 * avanzada la ronda, para insinuar el cruce) se lee sin gestos. Cada llave
 * es independiente — una página puede mostrar varias si el evento tiene más
 * de una categoría en formato bracket.
 */
export function LlaveArbol({ peleas }: { peleas: PeleaPublica[] }) {
  const rondas = [...new Set(peleas.map((p) => p.ronda ?? 0))].sort((a, b) => a - b);
  const ultimaRonda = rondas[rondas.length - 1];

  return (
    <div className="-mx-6 overflow-x-auto px-6">
      <div className="flex w-max gap-8 pb-2">
        {rondas.map((ronda) => {
          const deEstaRonda = peleas
            .filter((p) => (p.ronda ?? 0) === ronda)
            .sort((a, b) => (a.posicion ?? 0) - (b.posicion ?? 0));

          return (
            <div
              key={ronda}
              className="flex w-56 shrink-0 flex-col justify-around gap-6"
            >
              <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {ronda === ultimaRonda ? "Final" : `Ronda ${ronda}`}
              </p>
              {deEstaRonda.map((p) => (
                <div key={p.id} className="rounded-lg border border-borde bg-panel p-2">
                  <TarjetaPelea roja={p.roja ?? undefined} azul={p.azul ?? undefined} tamano="sm" />
                  <div className="mt-1 flex justify-center">
                    <Insignia estado={p.estado ?? "pendiente"} />
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
