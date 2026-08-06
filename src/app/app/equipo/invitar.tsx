"use client";

import { useActionState } from "react";
import { invitarMiembro, type EstadoFormulario } from "@/actions/academia";
import { Aviso, BotonEnvio } from "@/components/ui/formulario";
import { Campo } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NOMBRE_ROL, type Rol } from "@/config/roles";

const ROLES: Array<[Rol, string]> = [
  ["admin", "Administra el evento completo"],
  ["mesa", "Registra resultados durante la jornada"],
  ["coach", "Inscribe y paga por los alumnos de su club"],
  ["juez", "Consulta y puntúa"],
  ["lector", "Solo mira"],
];

export function FormularioInvitar() {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(invitarMiembro, {});

  return (
    <form action={accion} className="mt-6 grid gap-4 rounded-xl border border-borde bg-panel p-5">
      <label className="grid gap-1 text-sm">
        <span className="text-slate-600 dark:text-slate-400">Correo</span>
        <Campo name="email" type="email" required placeholder="mesa@academia.com" />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="text-slate-600 dark:text-slate-400">Rol</span>
        <Select name="rol" defaultValue="mesa">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map(([valor, desc]) => (
              <SelectItem key={valor} value={valor}>
                {NOMBRE_ROL[valor]}: {desc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <Aviso error={estado.error} ok={estado.ok} />
      <BotonEnvio>Invitar</BotonEnvio>
    </form>
  );
}
