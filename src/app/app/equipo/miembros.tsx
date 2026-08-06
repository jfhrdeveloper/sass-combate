"use client";

import { useActionState, useState } from "react";
import { eliminarMiembro, type EstadoFormulario } from "@/actions/academia";
import { Aviso } from "@/components/ui/formulario";
import { Boton } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { NOMBRE_ROL } from "@/config/roles";
import type { MiembroEquipo } from "@/services/equipo";
import { fechaLarga } from "@/utils/format";

function DialogoQuitar({ miembro }: { miembro: MiembroEquipo }) {
  const [abierto, setAbierto] = useState(false);
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(eliminarMiembro, {});

  return (
    <AlertDialog open={abierto} onOpenChange={setAbierto}>
      <AlertDialogTrigger asChild>
        <Boton type="button" variante="fantasma" tamano="sm">
          Quitar
        </Boton>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Quitar a {miembro.nombre ?? miembro.email}?</AlertDialogTitle>
          <AlertDialogDescription>
            Pierde acceso al panel de esta academia de inmediato. No borra nada de lo que ya cargó
            (resultados, pesajes, pagos), solo su acceso.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form
          action={async (datos) => {
            await accion(datos);
            setAbierto(false);
          }}
        >
          <input type="hidden" name="miembroId" value={miembro.id} />
          <Aviso error={estado.error} />
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Boton type="button" variante="contorno" tamano="sm">
                Cancelar
              </Boton>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Boton type="submit" variante="roja" tamano="sm">
                Quitar
              </Boton>
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ListaMiembros({ miembros }: { miembros: MiembroEquipo[] }) {
  return (
    <ul className="mt-3 grid gap-2">
      {miembros.map((m) => (
        <li
          key={m.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-borde bg-panel px-4 py-3"
        >
          <span>
            <span className="font-medium">{m.nombre ?? m.email ?? "Sin nombre"}</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">
              {NOMBRE_ROL[m.rol]} · miembro desde {fechaLarga(m.creado_en)}
            </span>
          </span>
          {m.rol === "dueno" ? (
            <span className="text-xs text-slate-400 dark:text-slate-500">Dueño de la academia</span>
          ) : (
            <DialogoQuitar miembro={m} />
          )}
        </li>
      ))}
    </ul>
  );
}
