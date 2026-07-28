import { Insignia } from "@/components/ui/badge";
import {
  AREAS_DEMO,
  BLOQUES_DEMO,
  EVENTO_DEMO,
  PELEAS_DEMO,
  inscripcionPorId,
} from "@/lib/datos";
import { construirAgenda, formatearRetraso } from "@/lib/horarios";
import { fechaLarga, hora } from "@/lib/format";

export const revalidate = 20;

export default async function PaginaPublica({
  params,
}: {
  params: Promise<{ org: string; evento: string }>;
}) {
  const { org } = await params;
  const agendas = construirAgenda(AREAS_DEMO, PELEAS_DEMO, BLOQUES_DEMO);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <p className="text-xs uppercase tracking-wide text-slate-400">{org}</p>
      <h1 className="text-2xl font-semibold">{EVENTO_DEMO.nombre}</h1>
      <p className="text-slate-600">
        {fechaLarga(EVENTO_DEMO.fecha)} · {EVENTO_DEMO.sede}
      </p>

      {agendas.map((ag) => (
        <section key={ag.area.id} className="mt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-medium">{ag.area.nombre}</h2>
            <span className="text-sm text-slate-500">{formatearRetraso(ag.retrasoSeg)}</span>
          </div>
          <ul className="mt-3 grid gap-2">
            {ag.filas.map((f) => {
              if (f.tipo === "bloque") {
                return (
                  <li
                    key={f.id}
                    className="rounded-lg border border-borde bg-amber-50 px-3 py-2 text-sm text-amber-900"
                  >
                    {hora(f.inicio)} · {f.nombre}
                  </li>
                );
              }
              const p = PELEAS_DEMO.find((x) => x.id === f.id)!;
              const roja = inscripcionPorId(p.roja_id);
              const azul = inscripcionPorId(p.azul_id);
              return (
                <li
                  key={f.id}
                  className="flex items-center gap-3 rounded-lg border border-borde bg-panel px-3 py-2"
                >
                  <span className="w-14 shrink-0 tabular-nums text-slate-600">
                    {hora(f.inicio)}
                  </span>
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="font-medium">{roja?.nombre}</span>
                    <span className="mx-1 text-slate-400">vs</span>
                    <span className="font-medium">{azul?.nombre}</span>
                    <span className="block text-xs text-slate-500">
                      {roja?.club} · {azul?.club}
                    </span>
                  </span>
                  <Insignia estado={f.estado ?? "pendiente"} />
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <p className="mt-8 text-center text-xs text-slate-400">
        Horarios estimados. Esta página se actualiza sola.
      </p>
    </main>
  );
}
