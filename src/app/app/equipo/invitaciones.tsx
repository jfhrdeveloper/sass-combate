"use client";

import { useActionState } from "react";
import { cancelarInvitacion, type EstadoFormulario } from "@/actions/academia";
import { Aviso } from "@/components/ui/formulario";
import { Boton } from "@/components/ui/button";
import { NOMBRE_ROL } from "@/config/roles";
import type { InvitacionPendiente } from "@/services/equipo";
import { fechaLarga } from "@/utils/format";

function BotonCancelar({ invitacion }: { invitacion: InvitacionPendiente }) {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(cancelarInvitacion, {});

  return (
    <form action={accion} className="flex items-center gap-2">
      <input type="hidden" name="invitacionId" value={invitacion.id} />
      <Aviso error={estado.error} />
      <Boton type="submit" variante="fantasma" tamano="sm">
        Cancelar
      </Boton>
    </form>
  );
}

export function ListaInvitaciones({ invitaciones }: { invitaciones: InvitacionPendiente[] }) {
  if (invitaciones.length === 0) return null;

  return (
    <>
      <h2 className="mt-8 text-lg font-medium">Invitaciones pendientes</h2>
      <ul className="mt-3 grid gap-2">
        {invitaciones.map((inv) => (
          <li
            key={inv.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-borde bg-panel px-4 py-3"
          >
            <span>
              <span className="font-medium">{inv.email}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                {NOMBRE_ROL[inv.rol]} · invitada el {fechaLarga(inv.creada_en)}
              </span>
            </span>
            <BotonCancelar invitacion={inv} />
          </li>
        ))}
      </ul>
    </>
  );
}
