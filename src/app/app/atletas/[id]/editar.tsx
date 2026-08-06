"use client";

import { useActionState, useState } from "react";
import { editarAtleta, type EstadoFormulario } from "@/actions/atletas";
import { Aviso, BotonEnvio } from "@/components/ui/formulario";
import { Campo } from "@/components/ui/input";
import { Boton } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ResumenAtleta } from "@/services/atletas";

export function EditarAtleta({ atleta }: { atleta: ResumenAtleta }) {
  const [abierto, setAbierto] = useState(false);
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(editarAtleta, {});

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Boton type="button" variante="contorno" tamano="sm">
          Editar
        </Boton>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar datos de {atleta.nombres}</DialogTitle>
          <DialogDescription>
            Este registro es compartido entre academias, así que el documento no se puede cambiar
            acá: es lo que cruza el historial de un atleta entre academias distintas.
          </DialogDescription>
        </DialogHeader>
        <form
          action={async (datos) => {
            await accion(datos);
            setAbierto(false);
          }}
          className="grid gap-3"
        >
          <input type="hidden" name="atletaId" value={atleta.id} />
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600 dark:text-slate-400">Nombres</span>
              <Campo name="nombres" defaultValue={atleta.nombres} required />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600 dark:text-slate-400">Apellidos</span>
              <Campo name="apellidos" defaultValue={atleta.apellidos} required />
            </label>
          </div>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600 dark:text-slate-400">Nacimiento</span>
            <Campo name="nacimiento" type="date" defaultValue={atleta.nacimiento ?? ""} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600 dark:text-slate-400">Sexo</span>
            <Select name="sexo" defaultValue={atleta.sexo ?? "sin_dato"}>
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
          <DialogFooter>
            <BotonEnvio>Guardar cambios</BotonEnvio>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
