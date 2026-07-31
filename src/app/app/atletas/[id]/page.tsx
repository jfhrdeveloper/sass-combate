import { notFound } from "next/navigation";
import { Tarjeta, TarjetaDato, TarjetaTitulo } from "@/components/ui/card";
import { historialVisible, obtenerAtleta } from "@/lib/atletas";
import { ETIQUETA_NIVEL, nivelPorPeleas } from "@/lib/nivel";
import { fechaLarga, kg } from "@/lib/format";
import { AgregarPeleaExterna } from "./agregar";

const COLOR: Record<string, string> = {
  victoria: "bg-exito-suave text-exito-fuerte",
  derrota: "bg-error-suave text-error-fuerte",
  empate: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300",
  exhibicion: "bg-info-suave text-info-fuerte",
  no_disputada: "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400",
};

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
      <h1 className="text-2xl font-semibold">
        {atleta.nombres} {atleta.apellidos}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        DNI {atleta.documento}
        {atleta.nacimiento ? ` · nacido el ${fechaLarga(atleta.nacimiento)}` : ""}
      </p>

      <section className="mt-6 grid gap-3 sm:grid-cols-4">
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
            {atleta.ultima_pelea ? fechaLarga(atleta.ultima_pelea) : "—"}
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
            <span className="w-24 shrink-0 text-sm tabular-nums text-slate-500">
              {fechaLarga(h.fecha)}
            </span>
            <span className="min-w-0 flex-1 text-sm">
              <span className="font-medium">{h.evento}</span>
              <span className="block text-xs text-slate-500">
                vs {h.rival ?? "—"}
                {h.club_rival ? ` (${h.club_rival})` : ""} · {h.modalidad ?? h.disciplina}
                {h.peso ? ` · ${kg(h.peso)}` : ""}
                {h.externa ? " · cargada a mano" : ""}
              </span>
            </span>
            <span
              className={`rounded-md px-2 py-1 font-display text-xs font-semibold uppercase tracking-wide ${COLOR[h.resultado]}`}
            >
              {h.resultado}
              {h.metodo ? ` · ${h.metodo}` : ""}
            </span>
          </li>
        ))}
      </ul>

      {ocultas > 0 && (
        <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 dark:bg-white/10 dark:text-slate-300">
          Tiene {ocultas} pelea{ocultas === 1 ? "" : "s"} más registrada
          {ocultas === 1 ? "" : "s"} por otras academias. Cuentan para su nivel,
          pero el detalle no es visible desde aquí.
        </p>
      )}

      <AgregarPeleaExterna atletaId={id} />
    </main>
  );
}
