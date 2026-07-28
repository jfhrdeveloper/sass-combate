"use client";

import { useMemo, useState } from "react";
import { Boton } from "@/components/ui/button";
import { Tarjeta, TarjetaDato, TarjetaTitulo } from "@/components/ui/card";
import { INSCRIPCIONES_DEMO } from "@/lib/datos";
import { REGLAS_POR_DEFECTO, emparejar, type Cruce } from "@/lib/emparejador";
import { NOMBRE_MODALIDAD } from "@/lib/types";
import { kg } from "@/lib/format";

export default function PaginaEmparejar() {
  const [reglas, setReglas] = useState(REGLAS_POR_DEFECTO);
  const [aceptados, setAceptados] = useState<Record<string, "si" | "no">>({});

  const resultado = useMemo(
    () => emparejar(INSCRIPCIONES_DEMO, reglas),
    [reglas]
  );

  const clave = (c: Cruce) => `${c.a.id}-${c.b.id}`;
  const confirmadas = resultado.parejas.filter((c) => aceptados[clave(c)] === "si").length;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">Emparejamiento</h1>
      <p className="mt-1 text-slate-600">
        El motor propone; el organizador decide. Ajusta las reglas y revisa los cruces.
      </p>

      <section className="mt-6 grid gap-3 sm:grid-cols-4">
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
          <TarjetaDato className={resultado.sinRival.length ? "text-roja" : ""}>
            {resultado.sinRival.length}
          </TarjetaDato>
        </Tarjeta>
      </section>

      <Tarjeta className="mt-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm">
            <span className="text-slate-600">
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
            <span className="text-slate-600">
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
          <label className="flex items-center gap-2 text-sm text-slate-600">
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
        <p className="text-sm text-slate-500">{confirmadas} confirmadas</p>
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
                  ? "border-emerald-400"
                  : decision === "no"
                    ? "border-borde opacity-50"
                    : "border-borde"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate">
                    <span className="font-medium text-roja">{c.a.nombre}</span>
                    <span className="mx-2 text-slate-400">vs</span>
                    <span className="font-medium text-azul">{c.b.nombre}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {c.a.club} {kg(c.a.peso_pesaje)} · {c.b.club} {kg(c.b.peso_pesaje)} ·{" "}
                    {NOMBRE_MODALIDAD[c.modalidad]} · {c.criterio}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs tabular-nums">
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

      {resultado.sinRival.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-medium">Sin rival</h2>
          <p className="text-sm text-slate-500">
            Hay que bajar tolerancias, fusionar categorías o avisar al coach.
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {resultado.sinRival.map((i) => (
              <li key={i.id} className="rounded-lg border border-borde bg-panel px-3 py-2 text-sm">
                <span className="font-medium">{i.nombre}</span>
                <span className="block text-xs text-slate-500">
                  {i.club} · {kg(i.peso_pesaje)} · {i.edad ?? "sin edad"} ·{" "}
                  {i.modalidades.map((m) => NOMBRE_MODALIDAD[m]).join(", ")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8 rounded-xl border border-borde bg-panel p-4">
        <h2 className="text-sm font-medium text-slate-500">Motivos de rechazo</h2>
        <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-3">
          {Object.entries(resultado.rechazos)
            .sort((a, b) => b[1] - a[1])
            .map(([motivo, n]) => (
              <li key={motivo} className="flex justify-between gap-2">
                <span className="text-slate-600">{motivo}</span>
                <span className="tabular-nums">{n}</span>
              </li>
            ))}
        </ul>
      </section>
    </main>
  );
}
