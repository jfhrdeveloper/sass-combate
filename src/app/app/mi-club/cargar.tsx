"use client";


import { useActionState, useMemo, useState } from "react";
import { cargarListaClub, type EstadoFormulario } from "@/app/acciones";
import { Aviso, BotonEnvio } from "@/components/ui/formulario";
import { Boton } from "@/components/ui/button";
import { analizarLista, separarValidas } from "@/lib/lista-club";

const EJEMPLO = `Jamil Zarate\t70123456\t2011-03-14\tM\t57\tlow_kick
Erika Saenz\t70987654\t2004-09-02\tF\t56.6\tlow_kick`;

export function CargarLista({ eventoId }: { eventoId: string }) {
  const [texto, setTexto] = useState("");
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(cargarListaClub, {});

  const filas = useMemo(() => analizarLista(texto), [texto]);
  const { validas, conError } = separarValidas(filas);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Cargar mi lista</h2>
        <Boton variante="fantasma" tamano="sm" onClick={() => setTexto(EJEMPLO)}>
          Ver ejemplo
        </Boton>
      </div>

      <p className="mt-1 text-sm text-slate-600">
        Pega las columnas desde tu Excel, una línea por alumno: nombre completo,
        documento, fecha de nacimiento, sexo, peso y modalidad.
      </p>

      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={8}
        placeholder="Jamil Zarate&#9;70123456&#9;2011-03-14&#9;M&#9;57&#9;low_kick"
        className="mt-3 w-full rounded-lg border border-borde bg-white p-3 font-mono text-xs outline-none focus:border-slate-400"
      />

      {filas.length > 0 && (
        <div className="mt-3 overflow-hidden rounded-xl border border-borde bg-panel">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Nombre</th>
                <th className="px-3 py-2 font-medium">Documento</th>
                <th className="px-3 py-2 font-medium">Nacimiento</th>
                <th className="px-3 py-2 font-medium">Peso</th>
                <th className="px-3 py-2 font-medium">Modalidad</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => (
                <tr
                  key={i}
                  className={`border-t border-borde ${f.error ? "bg-rose-50" : ""}`}
                >
                  <td className="px-3 py-2">
                    {f.nombre || "—"}
                    {f.error && (
                      <span className="block text-xs text-rose-700">{f.error}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{f.documento || "—"}</td>
                  <td className="px-3 py-2 tabular-nums">{f.nacimiento || "—"}</td>
                  <td className="px-3 py-2 tabular-nums">{f.peso || "—"}</td>
                  <td className="px-3 py-2">{f.modalidad || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form action={accion} className="mt-4 grid gap-3">
        <input type="hidden" name="eventoId" value={eventoId} />
        <input type="hidden" name="lista" value={JSON.stringify(validas)} />

        {conError.length > 0 && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {conError.length} línea{conError.length === 1 ? "" : "s"} con problemas.
            Se enviarán solo las {validas.length} correctas.
          </p>
        )}

        <Aviso error={estado.error} ok={estado.ok} />

        <BotonEnvio disabled={validas.length === 0}>
          Inscribir {validas.length} alumno{validas.length === 1 ? "" : "s"}
        </BotonEnvio>
      </form>

      <p className="mt-3 text-xs text-slate-400">
        Si un alumno ya compitió antes, el sistema lo reconoce por su documento y
        toma su récord para calcular el nivel.
      </p>
    </div>
  );
}
