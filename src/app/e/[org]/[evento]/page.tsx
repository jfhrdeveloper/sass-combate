import type { Metadata } from "next";
import { Insignia } from "@/components/ui/badge";
import { TarjetaPelea } from "@/components/ui/tarjeta-pelea";
import { obtenerAgendaPublica } from "@/lib/publico";
import { construirAgenda, formatearRetraso } from "@/lib/horarios";
import { fechaLarga, hora } from "@/lib/format";
import { urlEvento } from "@/lib/seo";

type Params = { org: string; evento: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { org, evento } = await params;
  const agenda = await obtenerAgendaPublica(org, evento);

  if (!agenda) {
    return { title: "Evento no encontrado", robots: { index: false, follow: false } };
  }

  const { nombre, fecha, sede } = agenda.evento;
  const titulo = `${nombre} — sass-combate`;
  const descripcion = `${fechaLarga(fecha)}${sede ? ` · ${sede}` : ""}. Programa en vivo, horarios estimados y resultados.`;

  return {
    title: { absolute: titulo },
    description: descripcion,
    alternates: { canonical: urlEvento(org, evento) },
    openGraph: { title: titulo, description: descripcion, type: "website" },
    twitter: { card: "summary", title: titulo, description: descripcion },
  };
}

export const revalidate = 20;

export default async function PaginaPublica({
  params,
}: {
  params: Promise<Params>;
}) {
  const { org, evento } = await params;
  const agenda = await obtenerAgendaPublica(org, evento);

  if (!agenda) {
    return (
      <main className="mx-auto max-w-3xl p-6 text-center text-slate-600">
        Evento no encontrado o todavía no es público.
      </main>
    );
  }

  const { areas, peleas, bloques } = agenda;
  const agendas = construirAgenda(areas, peleas, bloques);

  const primeraHora = areas.reduce(
    (min, a) => (a.hora_inicio < min ? a.hora_inicio : min),
    areas[0]?.hora_inicio ?? agenda.evento.fecha
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: agenda.evento.nombre,
    startDate: primeraHora,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: agenda.evento.sede ?? undefined,
      address: agenda.evento.sede ?? undefined,
    },
    organizer: { "@type": "Organization", name: org },
  };

  return (
    <main className="mx-auto max-w-3xl p-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <p className="text-xs uppercase tracking-wide text-slate-400">{org}</p>
      <h1 className="text-2xl font-semibold">{agenda.evento.nombre}</h1>
      <p className="text-slate-600">
        {fechaLarga(agenda.evento.fecha)} · {agenda.evento.sede}
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
                    className="rounded-lg border border-borde bg-aviso-suave px-3 py-2 text-sm text-aviso-fuerte"
                  >
                    {hora(f.inicio)} · {f.nombre}
                  </li>
                );
              }
              const p = peleas.find((x) => x.id === f.id)!;
              return (
                <li
                  key={f.id}
                  className="flex items-center gap-3 rounded-lg border border-borde bg-panel px-3 py-2"
                >
                  <span className="w-14 shrink-0 font-display tabular-nums text-slate-600">
                    {hora(f.inicio)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <TarjetaPelea roja={p.roja ?? undefined} azul={p.azul ?? undefined} tamano="sm" />
                    <span className="block text-center text-xs text-slate-500">
                      {p.club_roja} · {p.club_azul}
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
