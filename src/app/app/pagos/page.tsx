import { Tarjeta, TarjetaDato, TarjetaTitulo } from "@/components/ui/card";
import { Paginador } from "@/components/ui/paginador";
import { exigirAcademia } from "@/services/auth";
import { listarPagos, montoFinal } from "@/services/pagos";
import { paginar } from "@/lib/paginacion";
import { RevisarPago } from "./revisar";
import { fechaLarga } from "@/utils/format";

const COLOR: Record<string, string> = {
  en_revision: "bg-aviso-suave text-aviso-fuerte",
  aprobado: "bg-exito-suave text-exito-fuerte",
  rechazado: "bg-error-suave text-error-fuerte",
};

export default async function PaginaPagos({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const { academia } = await exigirAcademia();
  const todos = await listarPagos();
  const { items: pagos, pagina, totalPaginas } = paginar(todos, Number(page) || 1);

  // Los totales de las tarjetas son sobre TODOS los pagos, no solo la página visible.
  const pendientes = todos.filter((p) => p.estado === "en_revision");
  const recaudado = todos
    .filter((p) => p.estado === "aprobado")
    .reduce((s, p) => s + montoFinal(p), 0);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Pagos</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Comprobantes enviados por los coaches. Al aprobar uno, sus inscripciones
        quedan pagadas automáticamente.
      </p>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <Tarjeta>
          <TarjetaTitulo>Por revisar</TarjetaTitulo>
          <TarjetaDato className={pendientes.length ? "text-roja" : ""}>
            {pendientes.length}
          </TarjetaDato>
        </Tarjeta>
        <Tarjeta>
          <TarjetaTitulo>Recaudado</TarjetaTitulo>
          <TarjetaDato>S/ {recaudado.toFixed(2)}</TarjetaDato>
        </Tarjeta>
        <Tarjeta>
          <TarjetaTitulo>Comprobantes</TarjetaTitulo>
          <TarjetaDato>{todos.length}</TarjetaDato>
        </Tarjeta>
      </section>

      <ul className="mt-8 grid gap-2">
        {pagos.map((p) => (
          <li key={p.id} className="rounded-xl border border-borde bg-panel p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">
                  {p.club ?? "Sin club"} ·{" "}
                  {p.descuento_tipo ? (
                    <>
                      <span className="text-slate-400 line-through dark:text-slate-500">
                        S/ {Number(p.monto).toFixed(2)}
                      </span>{" "}
                      S/ {montoFinal(p).toFixed(2)}
                    </>
                  ) : (
                    <>S/ {Number(p.monto).toFixed(2)}</>
                  )}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {p.metodo}
                  {p.referencia ? ` · operación ${p.referencia}` : ""} ·{" "}
                  {fechaLarga(p.creado_en)}
                  {p.descuento_tipo && (
                    <>
                      {" "}
                      · descuento{" "}
                      {p.descuento_tipo === "porcentaje"
                        ? `${p.descuento_valor}%`
                        : `S/ ${p.descuento_valor?.toFixed(2)}`}
                    </>
                  )}
                </p>
              </div>
              <span
                className={`rounded-md px-2 py-1 font-display text-xs font-semibold uppercase tracking-wide ${COLOR[p.estado]}`}
              >
                {p.estado.replace("_", " ")}
              </span>
            </div>

            {p.motivo_rechazo && (
              <p className="mt-2 rounded-lg bg-error-suave px-3 py-2 text-xs text-error-fuerte">
                {p.motivo_rechazo}
              </p>
            )}

            {p.estado === "en_revision" && ["dueno", "admin"].includes(academia.rol) && (
              <RevisarPago pagoId={p.id} monto={Number(p.monto)} />
            )}
          </li>
        ))}
      </ul>

      {todos.length === 0 && (
        <p className="mt-10 text-center text-sm text-slate-500 dark:text-slate-400">
          Todavía no hay comprobantes.
        </p>
      )}

      <Paginador
        pagina={pagina}
        totalPaginas={totalPaginas}
        hrefPara={(p) => `/app/pagos?page=${p}`}
      />
    </main>
  );
}
