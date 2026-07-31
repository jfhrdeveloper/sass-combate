"use client";

import { useActionState } from "react";
import { responderReclamoAccion, type EstadoFormulario } from "@/app/acciones";
import { Aviso, BotonEnvio } from "@/components/ui/formulario";
import { AreaTexto } from "@/components/ui/input";

export function ResponderReclamo({ reclamoId }: { reclamoId: string }) {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(responderReclamoAccion, {});

  return (
    <form action={accion} className="mt-3 grid gap-2">
      <input type="hidden" name="reclamoId" value={reclamoId} />
      <AreaTexto name="respuesta" rows={3} placeholder="Escribe la respuesta para el consumidor" required />
      <Aviso error={estado.error} ok={estado.ok} />
      <BotonEnvio tamano="sm" className="justify-self-start">
        Responder
      </BotonEnvio>
    </form>
  );
}
