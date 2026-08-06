import type { Metadata } from "next";
import { obtenerAgendaPublica } from "@/services/publico";
import { construirAgenda } from "@/lib/horarios";
import { fechaLarga } from "@/utils/format";
import { urlEvento } from "@/lib/seo";
import { AgendaConBusqueda } from "./agenda-con-busqueda";
import { LlaveArbol } from "./llave-arbol";
import { BotonPantallaCompleta } from "@/components/boton-pantalla-completa";

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
      <main className="mx-auto max-w-3xl p-6 text-center text-slate-600 dark:text-slate-400">
        Evento no encontrado o todavía no es público.
      </main>
    );
  }

  const { areas, peleas, bloques } = agenda;
  const agendas = construirAgenda(areas, peleas, bloques);

  const llaves = new Map<string, typeof peleas>();
  for (const p of peleas) {
    if (p.tipo !== "bracket" || !p.llave_id) continue;
    llaves.set(p.llave_id, [...(llaves.get(p.llave_id) ?? []), p]);
  }

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
      <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">{org}</p>
      <h1 className="text-2xl font-semibold">{agenda.evento.nombre}</h1>
      <p className="text-slate-600 dark:text-slate-400">
        {fechaLarga(agenda.evento.fecha)} · {agenda.evento.sede}
      </p>

      {llaves.size > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-medium">Llave de eliminación</h2>
          <div className="mt-3 grid gap-6">
            {[...llaves.values()].map((deLaLlave) => (
              <LlaveArbol key={deLaLlave[0].llave_id} peleas={deLaLlave} />
            ))}
          </div>
        </section>
      )}

      <AgendaConBusqueda agendas={agendas} peleas={peleas} />

      <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
        Horarios estimados. Esta página se actualiza sola.
      </p>

      <BotonPantallaCompleta />
    </main>
  );
}
