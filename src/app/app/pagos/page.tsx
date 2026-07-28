import { Tarjeta, TarjetaDato, TarjetaTitulo } from "@/components/ui/card";
import { exigirAcademia } from "@/lib/auth";
import { listarPagos } from "@/lib/pagos";
import { RevisarPago } from "./revisar";
import { fechaLarga } from "@/lib/format";

const COLOR: Record<string, string> = {
  en_revision: "bg-amber-100 text-amber-900",
  aprobado: "bg-emerald-100 text-emerald-800",
  rechazado: "bg-rose-100 text-rose-800",
};

export default async function PaginaPagos() {
  const { academia } = await exigirAcademia();
  const pagos = await listarPagos();

  const pendientes = pagos.filter((p) => p.estado === "en_revision");
  const recaudado = pagos
    .filter((p) => p.estado === "aprobado")
    .reduce((s, p) => s + Number(p.monto), 0);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Pagos</h1>
      <p className="mt-1 text-sm text-slate-600">
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
          <TarjetaDato>{pagos.length}</TarjetaDato>
        </Tarjeta>
      </section>

      <ul className="mt-8 grid gap-2">
        {pagos.map((p) => (
          <li key={p.id} className="rounded-xl border border-borde bg-panel p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">
                  {p.club ?? "Sin club"} · S/ {Number(p.monto).toFixed(2)}
                </p>
                <p className="text-xs text-slate-500">
                  {p.metodo}
                  {p.referencia ? ` · operación ${p.referencia}` : ""} ·{" "}
                  {fechaLarga(p.creado_en)}
                </p>
              </div>
              <span className={`rounded-md px-2 py-1 text-xs font-medium ${COLOR[p.estado]}`}>
                {p.estado.replace("_", " ")}
              </span>
            </div>

            {p.motivo_rechazo && (
              <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800">
                {p.motivo_rechazo}
              </p>
            )}

            {p.estado === "en_revision" && ["dueno", "admin"].includes(academia.rol) && (
              <RevisarPago pagoId={p.id} />
            )}
          </li>
        ))}
      </ul>

      {pagos.length === 0 && (
        <p className="mt-10 text-center text-sm text-slate-500">
          Todavía no hay comprobantes.
        </p>
      )}
    </main>
  );
}
