import { notFound } from "next/navigation";
import { Tarjeta, TarjetaDato, TarjetaTitulo } from "@/components/ui/card";
import { Insignia } from "@/components/ui/badge";
import { historialVisible, obtenerAtleta } from "@/services/atletas";
import { ETIQUETA_NIVEL, nivelPorPeleas } from "@/lib/nivel";
import { fechaLarga, kg } from "@/utils/format";
import { AgregarPeleaExterna } from "./agregar";
import { EditarAtleta } from "./editar";

export default async function PaginaAtleta({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const atleta = await obtenerAtleta(id);
  if (!atleta) notFound();

  const historial = await historialVisible(id);
  const nivel = nivelPorPeleas(atleta.peleas);
  const ocultas = atleta.peleas - historial.filter((h) => h.resultado !== "exhibicion").length;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {atleta.nombres} {atleta.apellidos}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            DNI {atleta.documento}
            {atleta.nacimiento ? ` · nacido el ${fechaLarga(atleta.nacimiento)}` : ""}
          </p>
        </div>
        <EditarAtleta atleta={atleta} />
      </div>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tarjeta>
          <TarjetaTitulo>Récord</TarjetaTitulo>
          <TarjetaDato>
            {atleta.victorias}-{atleta.derrotas}
            {atleta.empates ? `-${atleta.empates}` : ""}
          </TarjetaDato>
        </Tarjeta>
        <Tarjeta>
          <TarjetaTitulo>Peleas</TarjetaTitulo>
          <TarjetaDato>{atleta.peleas}</TarjetaDato>
        </Tarjeta>
        <Tarjeta>
          <TarjetaTitulo>Nivel</TarjetaTitulo>
          <TarjetaDato className="text-xl">{ETIQUETA_NIVEL[nivel]}</TarjetaDato>
        </Tarjeta>
        <Tarjeta>
          <TarjetaTitulo>Última pelea</TarjetaTitulo>
          <TarjetaDato className="text-xl">
            {atleta.ultima_pelea ? fechaLarga(atleta.ultima_pelea) : "-"}
          </TarjetaDato>
        </Tarjeta>
      </section>

      <h2 className="mt-8 text-lg font-medium">Historial</h2>

      <ul className="mt-3 grid gap-2">
        {historial.map((h) => (
          <li
            key={h.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-borde bg-panel px-4 py-3"
          >
            <span className="w-24 shrink-0 text-sm tabular-nums text-slate-500 dark:text-slate-400">
              {fechaLarga(h.fecha)}
            </span>
            <span className="min-w-0 flex-1 text-sm">
              <span className="font-medium">{h.evento}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                vs {h.rival ?? "-"}
                {h.club_rival ? ` (${h.club_rival})` : ""} · {h.modalidad ?? h.disciplina}
                {h.peso ? ` · ${kg(h.peso)}` : ""}
                {h.externa ? " · cargada a mano" : ""}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5">
              <Insignia estado={h.resultado} />
              {h.metodo && (
                <span className="text-xs text-slate-500 dark:text-slate-400">· {h.metodo}</span>
              )}
            </span>
          </li>
        ))}
      </ul>

      {ocultas > 0 && (
        <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 dark:bg-white/10 dark:text-slate-400">
          Tiene {ocultas} pelea{ocultas === 1 ? "" : "s"} más registrada
          {ocultas === 1 ? "" : "s"} por otras academias. Cuentan para su nivel,
          pero el detalle no es visible desde aquí.
        </p>
      )}

      <AgregarPeleaExterna atletaId={id} />
    </main>
  );
}
