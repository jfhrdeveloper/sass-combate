"use client";

import { useActionState, useState } from "react";
import { revisarPago, type EstadoFormulario } from "@/app/acciones";
import { Aviso } from "@/components/ui/formulario";
import { Boton } from "@/components/ui/button";
import { Campo } from "@/components/ui/input";

export function RevisarPago({ pagoId }: { pagoId: string }) {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(revisarPago, {});
  const [rechazando, setRechazando] = useState(false);

  return (
    <form action={accion} className="mt-3 grid gap-2">
      <input type="hidden" name="pagoId" value={pagoId} />

      {rechazando && (
        <Campo name="motivo" placeholder="Motivo del rechazo" required />
      )}

      <Aviso error={estado.error} ok={estado.ok} />

      <div className="flex gap-2">
        <Boton type="submit" name="decision" value="aprobado" tamano="sm">
          Aprobar
        </Boton>
        {rechazando ? (
          <Boton type="submit" name="decision" value="rechazado" variante="roja" tamano="sm">
            Confirmar rechazo
          </Boton>
        ) : (
          <Boton
            type="button"
            variante="contorno"
            tamano="sm"
            onClick={() => setRechazando(true)}
          >
            Rechazar
          </Boton>
        )}
      </div>
    </form>
  );
}
