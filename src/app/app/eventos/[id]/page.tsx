import Link from "next/link";
import { notFound } from "next/navigation";
import { Insignia } from "@/components/ui/badge";
import { estilos } from "@/components/ui/button";
import { Tarjeta, TarjetaDato, TarjetaTitulo } from "@/components/ui/card";
import {
  listarCategorias,
  obtenerAreas,
  obtenerBloques,
  obtenerEvento,
  obtenerInscripciones,
  obtenerPeleas,
} from "@/services/consultas";
import { construirAgenda, formatearRetraso } from "@/lib/horarios";
import { categoriaDePeso } from "@/lib/categorias";
import { hora, kg } from "@/utils/format";
import { exigirAcademia } from "@/services/auth";
import { planEstaActivo } from "@/lib/planes";
import { DesbloquearEvento } from "./desbloquear";
import { CategoriasEvento } from "./categorias-evento";

export default async function PaginaEvento({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { academia, sesion } = await exigirAcademia();
  const [evento, areas, peleas, bloques, inscripciones, categorias] = await Promise.all([
    obtenerEvento(id),
    obtenerAreas(id),
    obtenerPeleas(id),
    obtenerBloques(id),
    obtenerInscripciones(id),
    listarCategorias(id),
  ]);
  if (!evento) notFound();

  const inscripcionPorId = new Map(inscripciones.map((i) => [i.id, i]));
  const agendas = construirAgenda(areas, peleas, bloques);
  const totalPeleas = peleas.length;
  const finalizadas = peleas.filter((p) => p.estado === "finalizada").length;
  const peorRetraso = agendas.length ? Math.max(...agendas.map((a) => a.retrasoSeg)) : 0;
  const cubiertoPorAcademia = planEstaActivo(academia.plan, academia.plan_vence_en);

  /** Categoría de un peleador: filtra por su primera modalidad antes de
   *  matchear por peso — `categoriaDePeso` en sí no conoce modalidades. */
  function categoriaDe(inscripcion: { peso_pesaje: number | null; sexo: "M" | "F" | null; modalidades: string[] } | undefined) {
    if (!inscripcion) return null;
    const propias = categorias.filter((c) => inscripcion.modalidades.includes(c.modalidad));
    return categoriaDePeso(propias, inscripcion.peso_pesaje, inscripcion.sexo);
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Evento {id}</p>
          <h1 className="text-2xl font-semibold">{evento.nombre}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{evento.sede}</p>
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
          <TarjetaDato>{inscripciones.length}</TarjetaDato>
        </Tarjeta>
        <Tarjeta>
          <TarjetaTitulo>Peleas</TarjetaTitulo>
          <TarjetaDato>{totalPeleas}</TarjetaDato>
        </Tarjeta>
        <Tarjeta>
          <TarjetaTitulo>Completadas</TarjetaTitulo>
          <TarjetaDato>
            {finalizadas}
            <span className="text-base text-slate-400 dark:text-slate-500"> / {totalPeleas}</span>
          </TarjetaDato>
        </Tarjeta>
        <Tarjeta>
          <TarjetaTitulo>Estado del reloj</TarjetaTitulo>
          <TarjetaDato className={peorRetraso > 600 ? "text-roja" : ""}>
            {formatearRetraso(peorRetraso)}
          </TarjetaDato>
        </Tarjeta>
      </section>

      <div className="mt-4 max-w-md">
        <DesbloquearEvento
          eventoId={id}
          email={sesion.email}
          cubiertoPorAcademia={cubiertoPorAcademia}
          venceEn={evento.plan_vence_en}
        />
      </div>

      <CategoriasEvento eventoId={id} categorias={categorias} />

      {agendas.map((ag) => (
        <section key={ag.area.id} className="mt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-medium">{ag.area.nombre}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              inicio {hora(ag.area.hora_inicio)} · fin estimado {hora(ag.finEstimado)} ·{" "}
              {formatearRetraso(ag.retrasoSeg)}
            </p>
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border border-borde bg-panel">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
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
                        <td className="px-3 py-2 text-slate-400 dark:text-slate-500">—</td>
                        <td className="px-3 py-2 font-medium text-aviso-fuerte" colSpan={3}>
                          {f.nombre} ({Math.round(f.duracionSeg / 60)} min)
                        </td>
                      </tr>
                    );
                  }
                  const p = peleas.find((x) => x.id === f.id)!;
                  const roja = p.roja_id ? inscripcionPorId.get(p.roja_id) : undefined;
                  const azul = p.azul_id ? inscripcionPorId.get(p.azul_id) : undefined;
                  const catRoja = categoriaDe(roja);
                  const catAzul = categoriaDe(azul);
                  return (
                    <tr key={f.id} className="border-t border-borde">
                      <td className="px-3 py-2 font-display tabular-nums">
                        {hora(f.inicio)}
                        {f.real && <span className="ml-1 text-xs text-slate-400 dark:text-slate-500">real</span>}
                      </td>
                      <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{f.orden}</td>
                      <td className="px-3 py-2">
                        <span className="font-display font-semibold text-roja">
                          {roja?.nombre ?? "—"}
                        </span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400">
                          {roja?.club} · {kg(roja?.peso_pesaje ?? null)}
                          {catRoja && ` · ${catRoja.nombre}`}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-display font-semibold text-azul">
                          {azul?.nombre ?? "—"}
                        </span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400">
                          {azul?.club} · {kg(azul?.peso_pesaje ?? null)}
                          {catAzul && ` · ${catAzul.nombre}`}
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
