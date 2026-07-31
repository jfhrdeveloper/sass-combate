import { Tarjeta, TarjetaDato, TarjetaTitulo } from "@/components/ui/card";
import { Paginador } from "@/components/ui/paginador";
import { exigirAcademia } from "@/services/auth";
import { listarEventos, obtenerInscripcionesClub, obtenerPrecioInscripcion } from "@/services/consultas";
import { CargarLista } from "./cargar";
import { SubirComprobante } from "./comprobante";
import { paginar } from "@/lib/paginacion";
import { kg } from "@/utils/format";

export default async function PaginaMiClub({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const { academia, sesion } = await exigirAcademia();
  const eventos = await listarEventos(academia.id);
  const activo = eventos.find((e) => e.estado !== "finalizado") ?? eventos[0];
  const mios = activo ? await obtenerInscripcionesClub(activo.id) : [];
  const precio = activo ? await obtenerPrecioInscripcion(activo.id) : 0;
  const pendientesDePago = mios.filter((i) => i.estado === "pendiente");
  const { items: visibles, pagina, totalPaginas } = paginar(mios, Number(page) || 1);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Mi club</h1>
      <p className="mt-1 text-sm text-slate-600">
        Inscribe a tus alumnos y paga por todos de una vez.
        {activo ? ` Evento activo: ${activo.nombre}.` : " No hay eventos abiertos."}
      </p>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <Tarjeta>
          <TarjetaTitulo>Inscritos</TarjetaTitulo>
          <TarjetaDato>{mios.length}</TarjetaDato>
        </Tarjeta>
        <Tarjeta>
          <TarjetaTitulo>Pagados</TarjetaTitulo>
          <TarjetaDato>{mios.length - pendientesDePago.length}</TarjetaDato>
        </Tarjeta>
        <Tarjeta>
          <TarjetaTitulo>Por pagar</TarjetaTitulo>
          <TarjetaDato>S/ {(pendientesDePago.length * precio).toFixed(2)}</TarjetaDato>
        </Tarjeta>
      </section>

      <h2 className="mt-8 text-lg font-medium">Mis alumnos inscritos</h2>
      <ul className="mt-3 grid gap-2">
        {visibles.map((i) => (
          <li
            key={i.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-borde bg-panel px-4 py-3"
          >
            <span>
              <span className="font-medium">{i.nombre}</span>
              <span className="block text-xs text-slate-500">
                {i.edad ?? "sin edad"} años · {kg(i.peso_pesaje)} · {i.nivel}
              </span>
            </span>
            {i.estado === "pendiente" ? (
              <span className="rounded-md bg-aviso-suave px-2 py-1 font-display text-xs font-semibold uppercase tracking-wide text-aviso-fuerte">
                por pagar
              </span>
            ) : (
              <span className="rounded-md bg-exito-suave px-2 py-1 font-display text-xs font-semibold uppercase tracking-wide text-exito-fuerte">
                pagado
              </span>
            )}
          </li>
        ))}
      </ul>

      <Paginador
        pagina={pagina}
        totalPaginas={totalPaginas}
        hrefPara={(p) => `/app/mi-club?page=${p}`}
      />

      {activo && <CargarLista eventoId={activo.id} />}
      {activo && pendientesDePago.length > 0 && (
        <SubirComprobante
          eventoId={activo.id}
          monto={pendientesDePago.length * precio}
          email={sesion.email}
        />
      )}
    </main>
  );
}
