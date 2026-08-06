"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { eliminarPeleador, type EstadoFormulario } from "@/actions/atletas";
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

export function EliminarPeleador({
  peleadorId,
  atletaId,
  nombre,
}: {
  peleadorId: string;
  atletaId: string;
  nombre: string;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(eliminarPeleador, {});

  return (
    <AlertDialog open={abierto} onOpenChange={setAbierto}>
      <AlertDialogTrigger asChild>
        <Boton type="button" variante="fantasma" tamano="sm">
          Eliminar
        </Boton>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar a {nombre} de tu academia?</AlertDialogTitle>
          <AlertDialogDescription>
            Se borra su registro y el historial de peleas que TU academia le cargó. No afecta a
            otras academias que también lo tengan registrado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form
          action={async (datos) => {
            await accion(datos);
            setAbierto(false);
            router.push("/app/atletas");
          }}
        >
          <input type="hidden" name="peleadorId" value={peleadorId} />
          <input type="hidden" name="atletaId" value={atletaId} />
          <Aviso error={estado.error} />
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Boton type="button" variante="contorno" tamano="sm">
                Cancelar
              </Boton>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Boton type="submit" variante="roja" tamano="sm">
                Eliminar
              </Boton>
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
