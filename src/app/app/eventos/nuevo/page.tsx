"use client";

import { useActionState } from "react";
import { crearEvento, type EstadoFormulario } from "@/actions/eventos";
import { Aviso, BotonEnvio } from "@/components/ui/formulario";
import { Campo } from "@/components/ui/input";

export default function PaginaNuevoEvento() {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(crearEvento, {});

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold">Nuevo evento</h1>

      <form action={accion} className="mt-6 grid gap-4 rounded-xl border border-borde bg-panel p-5">
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-400">Nombre</span>
          <Campo name="nombre" required placeholder="Contender Internacional 2026" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-400">Fecha</span>
          <Campo name="fecha" type="date" required />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-400">Sede</span>
          <Campo name="sede" placeholder="Casa de la Cultura, San Miguel" />
        </label>
        <Aviso error={estado.error} ok={estado.ok} />
        <BotonEnvio className="w-full">Crear evento</BotonEnvio>
      </form>
    </main>
  );
}
