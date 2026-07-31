"use client";

import { useActionState } from "react";
import { invitarMiembro, type EstadoFormulario } from "@/actions/academia";
import { Aviso, BotonEnvio } from "@/components/ui/formulario";
import { Campo } from "@/components/ui/input";

const ROLES: Array<[string, string]> = [
  ["admin", "Administra el evento completo"],
  ["mesa", "Registra resultados durante la jornada"],
  ["coach", "Inscribe y paga por los alumnos de su club"],
  ["juez", "Consulta y puntúa"],
  ["lector", "Solo mira"],
];

export default function PaginaEquipo() {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(invitarMiembro, {});

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Equipo</h1>
      <p className="mt-1 text-sm text-slate-600">
        Invita a quien va a estar en la mesa de control el día del evento.
      </p>

      <form action={accion} className="mt-6 grid gap-4 rounded-xl border border-borde bg-panel p-5">
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600">Correo</span>
          <Campo name="email" type="email" required placeholder="mesa@academia.com" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600">Rol</span>
          <select
            name="rol"
            defaultValue="mesa"
            className="h-10 rounded-lg border border-borde bg-panel px-3 text-sm"
          >
            {ROLES.map(([valor, desc]) => (
              <option key={valor} value={valor}>
                {valor} — {desc}
              </option>
            ))}
          </select>
        </label>
        <Aviso error={estado.error} ok={estado.ok} />
        <BotonEnvio>Invitar</BotonEnvio>
      </form>
    </main>
  );
}
