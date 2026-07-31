import type { Metadata } from "next";
import { listarReclamos } from "@/services/reclamos";
import { fechaLarga } from "@/utils/format";
import { ResponderReclamo } from "./responder";
import { Paginador } from "@/components/ui/paginador";
import { paginar } from "@/lib/paginacion";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PaginaReclamos({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const reclamos = await listarReclamos();
  const pendientes = reclamos.filter((r) => r.estado === "pendiente");
  const respondidos = reclamos.filter((r) => r.estado === "respondido");
  const {
    items: visibles,
    pagina,
    totalPaginas,
  } = paginar([...pendientes, ...respondidos], Number(page) || 1);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Libro de Reclamaciones</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        {pendientes.length} pendiente{pendientes.length === 1 ? "" : "s"} de responder · plazo
        máximo 15 días hábiles desde que se presentó cada uno, improrrogable.
      </p>

      {reclamos.length === 0 && (
        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Todavía no hay reclamos ni quejas registrados.
        </p>
      )}

      <ul className="mt-6 grid gap-3">
        {visibles.map((r) => (
          <li key={r.id} className="rounded-xl border border-borde bg-panel p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <span className="font-display font-semibold uppercase tracking-wide">
                  RC-{r.numero} · {r.tipo}
                </span>
                <span className="ml-2 rounded-md bg-slate-100 px-2 py-0.5 text-xs uppercase dark:bg-white/10 dark:text-slate-300">
                  {r.estado}
                </span>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {r.consumidor_nombre} · {r.documento_tipo.toUpperCase()} {r.documento_numero} ·{" "}
                  {r.consumidor_correo}
                  {r.consumidor_telefono ? ` · ${r.consumidor_telefono}` : ""}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {r.consumidor_domicilio}
                </p>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {fechaLarga(r.creado_en)}
              </span>
            </div>

            <p className="mt-3 text-sm">
              <span className="font-medium">{r.bien_o_servicio}</span>
              {r.monto_reclamado ? ` · S/ ${r.monto_reclamado}` : ""}
            </p>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{r.detalle}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Pide: {r.pedido}
            </p>

            {r.estado === "respondido" ? (
              <div className="mt-3 rounded-lg bg-exito-suave p-3 text-sm text-exito-fuerte">
                <p className="font-medium">Respuesta enviada {r.respondido_en ? `· ${fechaLarga(r.respondido_en)}` : ""}</p>
                <p className="mt-1">{r.respuesta}</p>
              </div>
            ) : (
              <ResponderReclamo reclamoId={r.id} />
            )}
          </li>
        ))}
      </ul>

      <Paginador
        pagina={pagina}
        totalPaginas={totalPaginas}
        hrefPara={(p) => `/admin/reclamos?page=${p}`}
      />
    </main>
  );
}
