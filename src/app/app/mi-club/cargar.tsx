"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useSincronizacion } from "@/lib/offline/sincronizacion";
import { EstadoConexion } from "@/components/estado-conexion";
import { Aviso } from "@/components/ui/formulario";
import { Boton } from "@/components/ui/button";
import { analizarLista, separarValidas } from "@/lib/lista-club";

const EJEMPLO = `Jamil Zarate\t70123456\t2011-03-14\tM\t57\tlow_kick
Erika Saenz\t70987654\t2004-09-02\tF\t56.6\tlow_kick`;

export function CargarLista({ eventoId }: { eventoId: string }) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [estado, setEstado] = useState<{ error?: string; ok?: string }>({});
  const sync = useSincronizacion(eventoId);

  const filas = useMemo(() => analizarLista(texto), [texto]);
  const { validas, conError } = separarValidas(filas);

  /** Cada alumno se encola por separado; la resolución contra el registro
   * compartido de atletas ocurre en el servidor al sincronizar, nunca aquí. */
  async function inscribir(e: FormEvent) {
    e.preventDefault();
    if (validas.length === 0) return;

    setEnviando(true);
    setEstado({});
    for (const f of validas) {
      await sync.registrar("inscripcion", f.documento, {
        nombre: f.nombre,
        documento: f.documento,
        nacimiento: f.nacimiento,
        sexo: f.sexo,
        peso: f.peso,
        modalidad: f.modalidad,
        telefono: f.telefono ?? null,
        email: f.email ?? null,
      });
    }
    const total = validas.length;
    setTexto("");
    setEnviando(false);
    setEstado({
      ok: `${total} alumno${total === 1 ? "" : "s"} en cola. Se ${
        total === 1 ? "envía" : "envían"
      } solo${total === 1 ? "" : "s"} cuando haya señal.`,
    });
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-medium">Cargar mi lista</h2>
        <div className="flex items-center gap-2">
          <EstadoConexion
            estado={sync.estado}
            pendientes={sync.pendientes}
            ultimaSync={sync.ultimaSync}
            onReintentar={sync.sincronizar}
          />
          <Boton variante="fantasma" tamano="sm" onClick={() => setTexto(EJEMPLO)}>
            Ver ejemplo
          </Boton>
        </div>
      </div>

      <p className="mt-1 text-sm text-slate-600">
        Pega las columnas desde tu Excel, una línea por alumno: nombre completo,
        documento, fecha de nacimiento, sexo, peso y modalidad. Si agregas teléfono
        y correo al final (opcional), le avisamos cuando su pelea se acerque.
      </p>

      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={8}
        placeholder="Jamil Zarate&#9;70123456&#9;2011-03-14&#9;M&#9;57&#9;low_kick"
        className="mt-3 w-full rounded-lg border border-borde bg-panel p-3 font-mono text-xs outline-none focus:border-slate-400"
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
                  className={`border-t border-borde ${f.error ? "bg-error-suave" : ""}`}
                >
                  <td className="px-3 py-2">
                    {f.nombre || "—"}
                    {f.error && (
                      <span className="block text-xs text-error-fuerte">{f.error}</span>
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

      <form onSubmit={inscribir} className="mt-4 grid gap-3">
        {conError.length > 0 && (
          <p className="rounded-lg bg-aviso-suave px-3 py-2 text-sm text-aviso-fuerte">
            {conError.length} línea{conError.length === 1 ? "" : "s"} con problemas.
            Se enviarán solo las {validas.length} correctas.
          </p>
        )}

        <Aviso error={estado.error} ok={estado.ok} />

        <Boton type="submit" disabled={validas.length === 0 || enviando}>
          {enviando
            ? "Encolando…"
            : `Inscribir ${validas.length} alumno${validas.length === 1 ? "" : "s"}`}
        </Boton>
      </form>

      <p className="mt-3 text-xs text-slate-400">
        Si un alumno ya compitió antes, el sistema lo reconoce por su documento y
        toma su récord para calcular el nivel. Sin señal, la inscripción queda
        guardada en este dispositivo y se envía sola en cuanto vuelva.
      </p>
    </div>
  );
}
