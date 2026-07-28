"use client";

import { useActionState } from "react";
import { registrarPeleaExterna, type EstadoFormulario } from "@/app/acciones";
import { Aviso, BotonEnvio } from "@/components/ui/formulario";
import { Campo } from "@/components/ui/input";

/**
 * Carga a mano una pelea que el atleta hizo fuera de la plataforma.
 * Es lo que evita que alguien con experiencia entre como debutante.
 */
export function AgregarPeleaExterna({ atletaId }: { atletaId: string }) {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(
    registrarPeleaExterna,
    {}
  );

  return (
    <details className="mt-8 rounded-xl border border-borde bg-panel p-4">
      <summary className="cursor-pointer text-sm font-medium">
        Agregar una pelea anterior
      </summary>

      <form action={accion} className="mt-4 grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="atletaId" value={atletaId} />

        <label className="grid gap-1 text-sm">
          <span className="text-slate-600">Fecha</span>
          <Campo name="fecha" type="date" required />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600">Evento</span>
          <Campo name="evento" required placeholder="Copa Regional 2025" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600">Disciplina</span>
          <Campo name="disciplina" required defaultValue="kickboxing" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600">Rival</span>
          <Campo name="rival" placeholder="Nombre del rival" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600">Resultado</span>
          <select
            name="resultado"
            className="h-10 rounded-lg border border-borde bg-white px-3 text-sm"
            defaultValue="victoria"
          >
            <option value="victoria">Victoria</option>
            <option value="derrota">Derrota</option>
            <option value="empate">Empate</option>
            <option value="exhibicion">Exhibición</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600">Método</span>
          <Campo name="metodo" placeholder="decisión, rsc…" />
        </label>

        <div className="sm:col-span-2">
          <Aviso error={estado.error} ok={estado.ok} />
        </div>
        <BotonEnvio className="sm:col-span-2">Agregar al historial</BotonEnvio>
      </form>
    </details>
  );
}
