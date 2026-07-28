import Link from "next/link";
import { Tarjeta, TarjetaDato, TarjetaTitulo } from "@/components/ui/card";
import { exigirAcademia } from "@/lib/auth";
import { listarEventos } from "@/lib/consultas";
import { fechaLarga } from "@/lib/format";

export default async function VistaGeneral() {
  const { academia } = await exigirAcademia();
  const eventos = await listarEventos(academia.id);

  const proximos = eventos.filter((e) => e.estado !== "finalizado");
  const pasados = eventos.filter((e) => e.estado === "finalizado");

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Eventos</h1>
        <Link
          href="/app/eventos/nuevo"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Nuevo evento
        </Link>
      </div>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <Tarjeta>
          <TarjetaTitulo>Eventos activos</TarjetaTitulo>
          <TarjetaDato>{proximos.length}</TarjetaDato>
        </Tarjeta>
        <Tarjeta>
          <TarjetaTitulo>Realizados</TarjetaTitulo>
          <TarjetaDato>{pasados.length}</TarjetaDato>
        </Tarjeta>
        <Tarjeta>
          <TarjetaTitulo>Plan</TarjetaTitulo>
          <TarjetaDato className="capitalize">{academia.plan}</TarjetaDato>
        </Tarjeta>
      </section>

      {eventos.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-borde p-10 text-center">
          <p className="font-medium">Todavía no hay eventos</p>
          <p className="mt-1 text-sm text-slate-500">
            Crea el primero y empieza a inscribir peleadores.
          </p>
          <Link
            href="/app/eventos/nuevo"
            className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Crear evento
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-2">
          {eventos.map((e) => (
            <li key={e.id}>
              <Link
                href={`/app/eventos/${e.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-borde bg-panel px-4 py-3 hover:border-slate-400"
              >
                <span>
                  <span className="font-medium">{e.nombre}</span>
                  <span className="block text-sm text-slate-500">
                    {fechaLarga(e.fecha)}
                    {e.sede ? ` · ${e.sede}` : ""}
                  </span>
                </span>
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs capitalize text-slate-600">
                  {e.estado.replace("_", " ")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
