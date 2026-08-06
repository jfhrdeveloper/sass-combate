"use client";

import { useActionState } from "react";
import { consultarOtrasAcademias, type EstadoFormulario } from "@/actions/atletas";
import { Aviso } from "@/components/ui/formulario";
import { Boton } from "@/components/ui/button";

/**
 * Explícito y puntual: solo consulta cuando el usuario lo pide, no guarda
 * nada ni cambia la ficha de esta academia. Ver `consultarOtrasAcademias`.
 */
export function BuscarOtrasAcademias({ documento }: { documento: string }) {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(consultarOtrasAcademias, {});

  return (
    <form action={accion} className="grid gap-2">
      <input type="hidden" name="documento" value={documento} />
      <Boton type="submit" variante="contorno" tamano="sm" className="w-fit">
        Buscar en otras academias
      </Boton>
      <Aviso error={estado.error} ok={estado.ok} />
    </form>
  );
}
