"use client";

import { use, useEffect, useState } from "react";
import { Boton } from "@/components/ui/button";
import { Insignia } from "@/components/ui/badge";
import { TarjetaPelea } from "@/components/ui/tarjeta-pelea";
import { BarraConexion, EstadoConexion } from "@/components/estado-conexion";
import { useSincronizacion } from "@/hooks/use-sincronizacion";
import { guardarCache, leerCache } from "@/services/offline-db";
import { AREAS_DEMO, BLOQUES_DEMO, CATEGORIAS_DEMO, PELEAS_DEMO, inscripcionPorId } from "@/lib/datos";
import { construirAgenda, formatearRetraso, proximasPeleas } from "@/lib/horarios";
import { categoriaDePeso } from "@/lib/categorias";
import { hora, kg } from "@/utils/format";
import {
  DISCIPLINA_POR_MODALIDAD,
  METODOS_POR_DISCIPLINA,
  NOMBRE_METODO,
  type Esquina,
  type Inscripcion,
  type MetodoCodigo,
} from "@/types";

/** La modalidad de la pelea es la que comparten roja y azul (así fue como el
 *  emparejador o el organizador los cruzó); si por algún motivo no comparten
 *  ninguna (dato cargado a mano, por ejemplo), cae a la primera de roja. Sin
 *  ninguna de las dos, cae al vocabulario de kickboxing — el que ya existía
 *  antes de que los métodos dependieran de la disciplina. */
function metodosDePelea(roja: Inscripcion | undefined, azul: Inscripcion | undefined) {
  const comun = roja?.modalidades.find((m) => azul?.modalidades.includes(m));
  const modalidad = comun ?? roja?.modalidades[0] ?? azul?.modalidades[0];
  const disciplina = modalidad ? DISCIPLINA_POR_MODALIDAD[modalidad] : "kickboxing";
  return METODOS_POR_DISCIPLINA[disciplina];
}

/** Solo etiqueta visual junto al peso — filtra las categorías del evento a
 *  las de la modalidad del propio peleador antes de matchear por peso. */
function categoriaDe(inscripcion: Inscripcion | undefined) {
  if (!inscripcion) return null;
  const propias = CATEGORIAS_DEMO.filter((c) => inscripcion.modalidades.includes(c.modalidad));
  return categoriaDePeso(propias, inscripcion.peso_pesaje, inscripcion.sexo);
}

/**
 * Paso del registro de resultado, uno a la vez: primero la esquina (el tap
 * más frecuente y más costoso de errar, botones "mesa" — h-24, guantes
 * puestos), después el método, y por último una confirmación explícita
 * antes de mandar nada — revertir un resultado mal marcado es un caos, así
 * que el último paso siempre repite lo elegido antes de tocar "Confirmar".
 */
type Paso =
  | { fase: "esquina"; peleaId: string }
  | { fase: "metodo"; peleaId: string; esquina: Esquina }
  | { fase: "confirmar"; peleaId: string; esquina: Esquina; metodo: MetodoCodigo };

export default function MesaDeControl({
  params,
}: {
  params: Promise<{ eventoId: string }>;
}) {
  const { eventoId } = use(params);
  const sync = useSincronizacion(eventoId);
  const [paso, setPaso] = useState<Paso | null>(null);
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

  async function confirmar(peleaId: string, ganador: Esquina, metodo: MetodoCodigo) {
    const nuevas = { ...resueltas, [peleaId]: ganador };
    setResueltas(nuevas);
    setPaso(null);
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
          <p className={`text-sm ${retraso > 600 ? "font-medium text-roja" : "text-slate-500 dark:text-slate-400"}`}>
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
          const enEsta = paso?.peleaId === p.id ? paso : null;

          return (
            <li key={f.id} className="rounded-xl border border-borde bg-panel p-4">
              <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                <span>
                  {area?.nombre} · pelea {f.orden} · {hora(f.inicio)}
                </span>
                <Insignia estado={f.estado ?? "pendiente"} />
              </div>

              <TarjetaPelea roja={roja?.nombre} azul={azul?.nombre} className="mt-2" />
              <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                <p className="text-right">
                  {roja?.club} · {kg(roja?.peso_pesaje ?? null)}
                  {categoriaDe(roja) && ` · ${categoriaDe(roja)!.nombre}`}
                </p>
                <p>
                  {azul?.club} · {kg(azul?.peso_pesaje ?? null)}
                  {categoriaDe(azul) && ` · ${categoriaDe(azul)!.nombre}`}
                </p>
              </div>

              {!enEsta ? (
                <Boton
                  className="mt-3 w-full"
                  tamano="mesa"
                  variante="contorno"
                  onClick={() => setPaso({ fase: "esquina", peleaId: p.id })}
                >
                  Registrar resultado
                </Boton>
              ) : enEsta.fase === "esquina" ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Boton
                    tamano="mesa"
                    variante="roja"
                    onClick={() => setPaso({ fase: "metodo", peleaId: p.id, esquina: "roja" })}
                  >
                    Gana roja
                  </Boton>
                  <Boton
                    tamano="mesa"
                    variante="azul"
                    onClick={() => setPaso({ fase: "metodo", peleaId: p.id, esquina: "azul" })}
                  >
                    Gana azul
                  </Boton>
                  <Boton className="col-span-2" variante="fantasma" onClick={() => setPaso(null)}>
                    Cancelar
                  </Boton>
                </div>
              ) : enEsta.fase === "metodo" ? (
                <div className="mt-3 grid gap-2">
                  <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                    Gana{" "}
                    <span className={enEsta.esquina === "roja" ? "text-roja" : "text-azul"}>
                      {enEsta.esquina === "roja" ? roja?.nombre : azul?.nombre}
                    </span>{" "}
                    — ¿por qué método?
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {metodosDePelea(roja, azul).map((m) => (
                      <Boton
                        key={m}
                        variante="contorno"
                        onClick={() =>
                          setPaso({ fase: "confirmar", peleaId: p.id, esquina: enEsta.esquina, metodo: m })
                        }
                      >
                        {NOMBRE_METODO[m]}
                      </Boton>
                    ))}
                  </div>
                  <Boton
                    variante="fantasma"
                    onClick={() => setPaso({ fase: "esquina", peleaId: p.id })}
                  >
                    ← Volver
                  </Boton>
                </div>
              ) : (
                <div className="mt-3 grid gap-3 rounded-lg bg-fondo p-3">
                  <p className="text-center text-sm">
                    ¿Confirmar que gana{" "}
                    <span className={`font-display font-semibold ${enEsta.esquina === "roja" ? "text-roja" : "text-azul"}`}>
                      {enEsta.esquina === "roja" ? roja?.nombre : azul?.nombre}
                    </span>{" "}
                    por <span className="font-medium">{NOMBRE_METODO[enEsta.metodo]}</span>?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Boton
                      variante="fantasma"
                      onClick={() =>
                        setPaso({ fase: "metodo", peleaId: p.id, esquina: enEsta.esquina })
                      }
                    >
                      ← Volver
                    </Boton>
                    <Boton
                      variante={enEsta.esquina === "roja" ? "roja" : "azul"}
                      onClick={() => confirmar(p.id, enEsta.esquina, enEsta.metodo)}
                    >
                      Confirmar
                    </Boton>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {proximas.length === 0 && (
        <p className="mt-10 text-center text-slate-500 dark:text-slate-400">No quedan peleas pendientes.</p>
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
