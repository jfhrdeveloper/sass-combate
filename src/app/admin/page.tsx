import type { Metadata } from "next";
import { Tarjeta, TarjetaDato, TarjetaTitulo } from "@/components/ui/card";
import { Paginador } from "@/components/ui/paginador";
import { academiasDePlataforma } from "@/services/auth";
import { paginar, tamanoPaginaActual } from "@/lib/paginacion";
import { fechaLarga } from "@/utils/format";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PanelPlataforma({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const academias = await academiasDePlataforma();
  const tamanoPagina = await tamanoPaginaActual();
  const { items: visibles, pagina, totalPaginas } = paginar(academias, Number(page) || 1, tamanoPagina);

  const total = academias.length;
  const conEventos = academias.filter((a) => a.eventos > 0).length;
  const inscripciones = academias.reduce((s, a) => s + a.inscripciones, 0);
  const dePago = academias.filter((a) => a.plan !== "free").length;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">Academias</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Vista del equipo de la plataforma. Solo lectura.
      </p>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tarjeta>
          <TarjetaTitulo>Academias</TarjetaTitulo>
          <TarjetaDato>{total}</TarjetaDato>
        </Tarjeta>
        <Tarjeta>
          <TarjetaTitulo>Ya activaron</TarjetaTitulo>
          <TarjetaDato>{conEventos}</TarjetaDato>
        </Tarjeta>
        <Tarjeta>
          <TarjetaTitulo>Inscripciones</TarjetaTitulo>
          <TarjetaDato>{inscripciones}</TarjetaDato>
        </Tarjeta>
        <Tarjeta>
          <TarjetaTitulo>Planes de pago</TarjetaTitulo>
          <TarjetaDato>{dePago}</TarjetaDato>
        </Tarjeta>
      </section>

      <div className="mt-8 overflow-x-auto rounded-xl border border-borde bg-panel">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-3 py-2 font-medium">Academia</th>
              <th className="px-3 py-2 font-medium">Plan</th>
              <th className="px-3 py-2 font-medium">Equipo</th>
              <th className="px-3 py-2 font-medium">Eventos</th>
              <th className="px-3 py-2 font-medium">Inscritos</th>
              <th className="px-3 py-2 font-medium">Último evento</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((a) => (
              <tr key={a.id} className="border-t border-borde">
                <td className="px-3 py-2">
                  <span className="font-medium">{a.nombre}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{a.slug}</span>
                </td>
                <td className="px-3 py-2 capitalize">{a.plan}</td>
                <td className="px-3 py-2 tabular-nums">{a.miembros}</td>
                <td className="px-3 py-2 tabular-nums">{a.eventos}</td>
                <td className="px-3 py-2 tabular-nums">{a.inscripciones}</td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                  {a.ultimo_evento ? fechaLarga(a.ultimo_evento) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {academias.length === 0 && (
        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">Todavía no hay academias.</p>
      )}

      <Paginador pagina={pagina} totalPaginas={totalPaginas} hrefPara={(p) => `/admin?page=${p}`} />

      <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
        Esta vista no expone peleadores ni resultados. Ver datos de una academia
        requiere que su dueño te invite como miembro.
      </p>
    </main>
  );
}
