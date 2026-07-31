import Link from "next/link";
import { Tarjeta, TarjetaDato, TarjetaTitulo } from "@/components/ui/card";
import { Insignia } from "@/components/ui/badge";
import { estilos } from "@/components/ui/button";
import { Paginador } from "@/components/ui/paginador";
import { exigirAcademia } from "@/services/auth";
import { listarEventos } from "@/services/consultas";
import { fechaLarga } from "@/utils/format";
import { cn } from "@/utils/cn";
import { paginar } from "@/lib/paginacion";

export default async function VistaGeneral({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const { academia } = await exigirAcademia();
  const eventos = await listarEventos(academia.id);
  const { items: visibles, pagina, totalPaginas } = paginar(eventos, Number(page) || 1);

  const proximos = eventos.filter((e) => e.estado !== "finalizado");
  const pasados = eventos.filter((e) => e.estado === "finalizado");

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Eventos</h1>
        <Link href="/app/eventos/nuevo" className={estilos({ tamano: "md" })}>
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
        <Link href="/app/plan">
          <Tarjeta className="h-full transition-colors hover:border-slate-400">
            <TarjetaTitulo>Plan</TarjetaTitulo>
            <TarjetaDato className="capitalize">{academia.plan}</TarjetaDato>
          </Tarjeta>
        </Link>
      </section>

      {eventos.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-borde p-10 text-center">
          <p className="font-medium">Todavía no hay eventos</p>
          <p className="mt-1 text-sm text-slate-500">
            Crea el primero y empieza a inscribir peleadores.
          </p>
          <Link href="/app/eventos/nuevo" className={cn(estilos({ tamano: "md" }), "mt-4 inline-block")}>
            Crear evento
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-8 grid gap-2">
            {visibles.map((e) => (
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
                  <Insignia estado={e.estado} />
                </Link>
              </li>
            ))}
          </ul>

          <Paginador pagina={pagina} totalPaginas={totalPaginas} hrefPara={(p) => `/app?page=${p}`} />
        </>
      )}
    </main>
  );
}
