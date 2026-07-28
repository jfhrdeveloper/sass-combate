import { Tarjeta, TarjetaDato, TarjetaTitulo } from "@/components/ui/card";
import { exigirAcademia } from "@/lib/auth";
import { listarEventos } from "@/lib/consultas";
import { CargarLista } from "./cargar";
import { SubirComprobante } from "./comprobante";
import { INSCRIPCIONES_DEMO } from "@/lib/datos";
import { kg } from "@/lib/format";

export default async function PaginaMiClub() {
  const { academia } = await exigirAcademia();
  const eventos = await listarEventos(academia.id);
  const activo = eventos.find((e) => e.estado !== "finalizado") ?? eventos[0];
  const mios = INSCRIPCIONES_DEMO.slice(0, 6);

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
          <TarjetaDato>0</TarjetaDato>
        </Tarjeta>
        <Tarjeta>
          <TarjetaTitulo>Por pagar</TarjetaTitulo>
          <TarjetaDato>S/ {(mios.length * 50).toFixed(2)}</TarjetaDato>
        </Tarjeta>
      </section>

      <h2 className="mt-8 text-lg font-medium">Mis alumnos inscritos</h2>
      <ul className="mt-3 grid gap-2">
        {mios.map((i) => (
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
            <span className="rounded-md bg-amber-100 px-2 py-1 text-xs text-amber-900">
              por pagar
            </span>
          </li>
        ))}
      </ul>

      {activo && <CargarLista eventoId={activo.id} />}
      {activo && <SubirComprobante eventoId={activo.id} monto={mios.length * 50} />}
    </main>
  );
}
