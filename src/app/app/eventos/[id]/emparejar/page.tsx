"use client";

import { useMemo, useState } from "react";
import { Boton } from "@/components/ui/button";
import { Tarjeta, TarjetaDato, TarjetaTitulo } from "@/components/ui/card";
import { TarjetaPelea } from "@/components/ui/tarjeta-pelea";
import { CATEGORIAS_DEMO, INSCRIPCIONES_DEMO } from "@/lib/datos";
import { REGLAS_POR_DEFECTO, emparejar, type Cruce } from "@/lib/emparejador";
import { categoriaDePeso } from "@/lib/categorias";
import { NOMBRE_MODALIDAD, type ModalidadCodigo, type Inscripcion } from "@/types";
import { kg } from "@/utils/format";

/** Solo etiqueta visual — el emparejador de arriba ya cruzó por tolerancia de
 *  peso; esto no participa de esa decisión, solo la muestra. */
function nombreCategoria(modalidad: ModalidadCodigo, peso: number | null, sexo: Inscripcion["sexo"]) {
  const propias = CATEGORIAS_DEMO.filter((c) => c.modalidad === modalidad);
  return categoriaDePeso(propias, peso, sexo)?.nombre ?? null;
}

interface ParManual {
  a: Inscripcion;
  b: Inscripcion;
}

export default function PaginaEmparejar() {
  const [reglas, setReglas] = useState(REGLAS_POR_DEFECTO);
  const [aceptados, setAceptados] = useState<Record<string, "si" | "no">>({});
  const [manuales, setManuales] = useState<ParManual[]>([]);
  const [arrastrando, setArrastrando] = useState<string | null>(null);

  const resultado = useMemo(
    () => emparejar(INSCRIPCIONES_DEMO, reglas),
    [reglas]
  );

  const clave = (c: Cruce) => `${c.a.id}-${c.b.id}`;
  const confirmadas = resultado.parejas.filter((c) => aceptados[clave(c)] === "si").length;

  const idsEnManual = new Set(manuales.flatMap((p) => [p.a.id, p.b.id]));
  const sinRivalRestantes = resultado.sinRival.filter((i) => !idsEnManual.has(i.id));

  /**
   * Arrastrar un "sin rival" sobre otro los empareja a mano — el único caso
   * donde drag-and-drop aporta sobre aceptar/descartar: acá no hay ninguna
   * propuesta del motor que aceptar, es intervención manual pura. El resto
   * de la pantalla (propuestas del algoritmo) sigue con botones a propósito,
   * ver docs/pending-task.md.
   */
  function soltar(e: React.DragEvent, destino: Inscripcion) {
    e.preventDefault();
    const origenId = e.dataTransfer.getData("text/plain");
    setArrastrando(null);
    if (!origenId || origenId === destino.id) return;
    const origen = resultado.sinRival.find((i) => i.id === origenId);
    if (!origen) return;
    setManuales((prev) => [...prev, { a: origen, b: destino }]);
  }

  function deshacerManual(par: ParManual) {
    setManuales((prev) => prev.filter((p) => p !== par));
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">Emparejamiento</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">
        El motor propone; el organizador decide. Ajusta las reglas y revisa los cruces.
      </p>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tarjeta>
          <TarjetaTitulo>Inscritos</TarjetaTitulo>
          <TarjetaDato>{INSCRIPCIONES_DEMO.length}</TarjetaDato>
        </Tarjeta>
        <Tarjeta>
          <TarjetaTitulo>Cruces válidos</TarjetaTitulo>
          <TarjetaDato>{resultado.cruceValidos}</TarjetaDato>
        </Tarjeta>
        <Tarjeta>
          <TarjetaTitulo>Peleas propuestas</TarjetaTitulo>
          <TarjetaDato>{resultado.parejas.length}</TarjetaDato>
        </Tarjeta>
        <Tarjeta>
          <TarjetaTitulo>Sin rival</TarjetaTitulo>
          <TarjetaDato className={sinRivalRestantes.length ? "text-roja" : ""}>
            {sinRivalRestantes.length}
          </TarjetaDato>
        </Tarjeta>
      </section>

      <Tarjeta className="mt-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              Diferencia máxima de peso: {reglas.maxDifPesoPct}%
            </span>
            <input
              type="range"
              min={2}
              max={20}
              step={1}
              value={reglas.maxDifPesoPct}
              onChange={(e) =>
                setReglas({ ...reglas, maxDifPesoPct: Number(e.target.value) })
              }
              className="mt-2 w-full"
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              Diferencia máxima de edad: {reglas.maxDifEdad} años
            </span>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={reglas.maxDifEdad}
              onChange={(e) => setReglas({ ...reglas, maxDifEdad: Number(e.target.value) })}
              className="mt-2 w-full"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={reglas.permitirMismoClub}
              onChange={(e) =>
                setReglas({ ...reglas, permitirMismoClub: e.target.checked })
              }
            />
            Permitir peleas del mismo club
          </label>
        </div>
      </Tarjeta>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-medium">Propuestas</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{confirmadas} confirmadas</p>
      </div>

      <ul className="mt-3 grid gap-2">
        {resultado.parejas.map((c) => {
          const k = clave(c);
          const decision = aceptados[k];
          return (
            <li
              key={k}
              className={`rounded-xl border bg-panel p-3 ${
                decision === "si"
                  ? "border-exito"
                  : decision === "no"
                    ? "border-borde opacity-50"
                    : "border-borde"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <TarjetaPelea roja={c.a.nombre} azul={c.b.nombre} tamano="sm" />
                  <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">
                    {c.a.club} {kg(c.a.peso_pesaje)}
                    {nombreCategoria(c.modalidad, c.a.peso_pesaje, c.a.sexo) &&
                      ` (${nombreCategoria(c.modalidad, c.a.peso_pesaje, c.a.sexo)})`}{" "}
                    · {c.b.club} {kg(c.b.peso_pesaje)}
                    {nombreCategoria(c.modalidad, c.b.peso_pesaje, c.b.sexo) &&
                      ` (${nombreCategoria(c.modalidad, c.b.peso_pesaje, c.b.sexo)})`}{" "}
                    · {NOMBRE_MODALIDAD[c.modalidad]} · {c.criterio}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-slate-100 px-2 py-1 font-display text-sm font-semibold tabular-nums dark:bg-white/10 dark:text-slate-100">
                    {c.score.toFixed(0)}
                  </span>
                  <Boton
                    tamano="sm"
                    variante={decision === "si" ? "solido" : "contorno"}
                    onClick={() => setAceptados({ ...aceptados, [k]: "si" })}
                  >
                    Aceptar
                  </Boton>
                  <Boton
                    tamano="sm"
                    variante="fantasma"
                    onClick={() => setAceptados({ ...aceptados, [k]: "no" })}
                  >
                    Descartar
                  </Boton>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {manuales.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-medium">Emparejamientos manuales</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Armados a mano arrastrando peleadores de &ldquo;sin rival&rdquo;: el motor no los propuso.
          </p>
          <ul className="mt-3 grid gap-2">
            {manuales.map((par) => (
              <li
                key={`${par.a.id}-${par.b.id}`}
                className="rounded-xl border border-exito bg-panel p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <TarjetaPelea roja={par.a.nombre} azul={par.b.nombre} tamano="sm" />
                    <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">
                      {par.a.club} {kg(par.a.peso_pesaje)} · {par.b.club} {kg(par.b.peso_pesaje)}
                    </p>
                  </div>
                  <Boton tamano="sm" variante="fantasma" onClick={() => deshacerManual(par)}>
                    Deshacer
                  </Boton>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {sinRivalRestantes.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-medium">Sin rival</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Hay que bajar tolerancias, fusionar categorías, avisar al coach, o arrastrar dos
            peleadores entre sí para emparejarlos a mano.
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {sinRivalRestantes.map((i) => (
              <li
                key={i.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", i.id);
                  e.dataTransfer.effectAllowed = "move";
                  setArrastrando(i.id);
                }}
                onDragEnd={() => setArrastrando(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => soltar(e, i)}
                className={`cursor-grab rounded-lg border border-borde bg-panel px-3 py-2 text-sm transition-colors active:cursor-grabbing ${
                  arrastrando && arrastrando !== i.id
                    ? "border-dashed border-exito bg-exito-suave/40"
                    : ""
                }`}
              >
                <span className="font-medium">{i.nombre}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">
                  {i.club} · {kg(i.peso_pesaje)} · {i.edad ?? "sin edad"} ·{" "}
                  {i.modalidades.map((m) => NOMBRE_MODALIDAD[m]).join(", ")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8 rounded-xl border border-borde bg-panel p-4">
        <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">Motivos de rechazo</h2>
        <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-3">
          {Object.entries(resultado.rechazos)
            .sort((a, b) => b[1] - a[1])
            .map(([motivo, n]) => (
              <li key={motivo} className="flex justify-between gap-2">
                <span className="text-slate-600 dark:text-slate-400">{motivo}</span>
                <span className="tabular-nums">{n}</span>
              </li>
            ))}
        </ul>
      </section>
    </main>
  );
}
