import Link from "next/link";
import { Insignia } from "@/components/ui/badge";
import { estilos } from "@/components/ui/button";
import { Tarjeta, TarjetaDato, TarjetaTitulo } from "@/components/ui/card";
import {
  AREAS_DEMO,
  BLOQUES_DEMO,
  EVENTO_DEMO,
  INSCRIPCIONES_DEMO,
  PELEAS_DEMO,
  inscripcionPorId,
} from "@/lib/datos";
import { construirAgenda, formatearRetraso } from "@/lib/horarios";
import { hora, kg } from "@/lib/format";
import { exigirAcademia } from "@/lib/auth";
import { planEstaActivo } from "@/lib/planes";
import { DesbloquearEvento } from "./desbloquear";

export default async function PaginaEvento({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { academia, sesion } = await exigirAcademia();
  const agendas = construirAgenda(AREAS_DEMO, PELEAS_DEMO, BLOQUES_DEMO);
  const totalPeleas = PELEAS_DEMO.length;
  const finalizadas = PELEAS_DEMO.filter((p) => p.estado === "finalizada").length;
  const peorRetraso = Math.max(...agendas.map((a) => a.retrasoSeg));
  const cubiertoPorAcademia = planEstaActivo(academia.plan, academia.plan_vence_en);

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Evento {id}</p>
          <h1 className="text-2xl font-semibold">{EVENTO_DEMO.nombre}</h1>
          <p className="text-sm text-slate-600">{EVENTO_DEMO.sede}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/app/eventos/${id}/emparejar`} className={estilos({ tamano: "md" })}>
            Emparejar
          </Link>
          <Link
            href={`/app/eventos/${id}/pesaje`}
            className="rounded-lg border border-borde bg-panel px-4 py-2 font-display font-semibold transition-colors hover:bg-fondo"
          >
            Pesaje
          </Link>
          <Link
            href={`/mesa/${id}`}
            className="rounded-lg border border-borde bg-panel px-4 py-2 font-display font-semibold transition-colors hover:bg-fondo"
          >
            Mesa de control
          </Link>
          <a
            href={`/api/eventos/${id}/credenciales`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-borde bg-panel px-4 py-2 font-display font-semibold transition-colors hover:bg-fondo"
          >
            Credenciales
          </a>
          <a
            href={`/api/eventos/${id}/acta`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-borde bg-panel px-4 py-2 font-display font-semibold transition-colors hover:bg-fondo"
          >
            Acta
          </a>
        </div>
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-4">
        <Tarjeta>
          <TarjetaTitulo>Inscritos</TarjetaTitulo>
          <TarjetaDato>{INSCRIPCIONES_DEMO.length}</TarjetaDato>
        </Tarjeta>
        <Tarjeta>
          <TarjetaTitulo>Peleas</TarjetaTitulo>
          <TarjetaDato>{totalPeleas}</TarjetaDato>
        </Tarjeta>
        <Tarjeta>
          <TarjetaTitulo>Completadas</TarjetaTitulo>
          <TarjetaDato>
            {finalizadas}
            <span className="text-base text-slate-400"> / {totalPeleas}</span>
          </TarjetaDato>
        </Tarjeta>
        <Tarjeta>
          <TarjetaTitulo>Estado del reloj</TarjetaTitulo>
          <TarjetaDato className={peorRetraso > 600 ? "text-roja" : ""}>
            {formatearRetraso(peorRetraso)}
          </TarjetaDato>
        </Tarjeta>
      </section>

      {/* EVENTO_DEMO.plan_vence_en, no obtenerEvento(id): esta página ya
          ignora HAY_SUPABASE en todo lo demás (usa *_DEMO fijo, ver
          docs/pending-task.md) — cuando eso se corrija, acá también hay que
          leer el evento real. */}
      <div className="mt-4 max-w-md">
        <DesbloquearEvento
          eventoId={id}
          email={sesion.email}
          cubiertoPorAcademia={cubiertoPorAcademia}
          venceEn={EVENTO_DEMO.plan_vence_en}
        />
      </div>

      {agendas.map((ag) => (
        <section key={ag.area.id} className="mt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-medium">{ag.area.nombre}</h2>
            <p className="text-sm text-slate-500">
              inicio {hora(ag.area.hora_inicio)} · fin estimado {hora(ag.finEstimado)} ·{" "}
              {formatearRetraso(ag.retrasoSeg)}
            </p>
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border border-borde bg-panel">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Hora</th>
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Esquina roja</th>
                  <th className="px-3 py-2 font-medium">Esquina azul</th>
                  <th className="px-3 py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {ag.filas.map((f) => {
                  if (f.tipo === "bloque") {
                    return (
                      <tr key={f.id} className="border-t border-borde bg-aviso-suave/60">
                        <td className="px-3 py-2 tabular-nums">{hora(f.inicio)}</td>
                        <td className="px-3 py-2 text-slate-400">—</td>
                        <td className="px-3 py-2 font-medium text-aviso-fuerte" colSpan={3}>
                          {f.nombre} ({Math.round(f.duracionSeg / 60)} min)
                        </td>
                      </tr>
                    );
                  }
                  const p = PELEAS_DEMO.find((x) => x.id === f.id)!;
                  const roja = inscripcionPorId(p.roja_id);
                  const azul = inscripcionPorId(p.azul_id);
                  return (
                    <tr key={f.id} className="border-t border-borde">
                      <td className="px-3 py-2 font-display tabular-nums">
                        {hora(f.inicio)}
                        {f.real && <span className="ml-1 text-xs text-slate-400">real</span>}
                      </td>
                      <td className="px-3 py-2 text-slate-500">{f.orden}</td>
                      <td className="px-3 py-2">
                        <span className="font-display font-semibold text-roja">
                          {roja?.nombre ?? "—"}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {roja?.club} · {kg(roja?.peso_pesaje ?? null)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-display font-semibold text-azul">
                          {azul?.nombre ?? "—"}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {azul?.club} · {kg(azul?.peso_pesaje ?? null)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <Insignia estado={f.estado ?? "pendiente"} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </main>
  );
}
