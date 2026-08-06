"use client";

import { useActionState } from "react";
import { crearPeleador, type EstadoFormulario } from "@/actions/atletas";
import { Aviso, BotonEnvio } from "@/components/ui/formulario";
import { Campo } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function FormularioNuevoPeleador({ documento }: { documento: string }) {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(crearPeleador, {});

  return (
    <form action={accion} className="mt-4 grid gap-3 rounded-xl border border-borde bg-panel p-4">
      <input type="hidden" name="documento" value={documento} />
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-400">Nombres</span>
          <Campo name="nombres" required autoFocus />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-400">Apellidos</span>
          <Campo name="apellidos" required />
        </label>
      </div>
      <label className="grid gap-1 text-sm">
        <span className="text-slate-600 dark:text-slate-400">Nacimiento</span>
        <Campo name="nacimiento" type="date" />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="text-slate-600 dark:text-slate-400">Sexo</span>
        <Select name="sexo" defaultValue="sin_dato">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sin_dato">Sin dato</SelectItem>
            <SelectItem value="M">Varón</SelectItem>
            <SelectItem value="F">Mujer</SelectItem>
          </SelectContent>
        </Select>
      </label>
      <Aviso error={estado.error} ok={estado.ok} />
      <BotonEnvio>Agregar a mi academia</BotonEnvio>
    </form>
  );
}
