import { listarEquipo, listarInvitacionesPendientes } from "@/services/equipo";
import { FormularioInvitar } from "./invitar";
import { ListaMiembros } from "./miembros";
import { ListaInvitaciones } from "./invitaciones";

export default async function PaginaEquipo() {
  const [miembros, invitaciones] = await Promise.all([
    listarEquipo(),
    listarInvitacionesPendientes(),
  ]);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Equipo</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Invita a quien va a estar en la mesa de control el día del evento.
      </p>

      <h2 className="mt-8 text-lg font-medium">Miembros</h2>
      <ListaMiembros miembros={miembros} />

      <ListaInvitaciones invitaciones={invitaciones} />

      <h2 className="mt-8 text-lg font-medium">Invitar a alguien nuevo</h2>
      <FormularioInvitar />
    </main>
  );
}
