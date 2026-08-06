"use client";

import { useActionState } from "react";
import { registrarPeleaExterna, type EstadoFormulario } from "@/actions/atletas";
import { Aviso, BotonEnvio } from "@/components/ui/formulario";
import { Campo } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** Carga a mano una pelea que el atleta hizo fuera de la plataforma o en un
 *  evento que tu academia organizó antes de usar sass-combate. */
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
          <span className="text-slate-600 dark:text-slate-400">Fecha</span>
          <Campo name="fecha" type="date" required />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-400">Evento</span>
          <Campo name="evento" required placeholder="Copa Regional 2025" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-400">Disciplina</span>
          <Campo name="disciplina" required defaultValue="kickboxing" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-400">Rival</span>
          <Campo name="rival" placeholder="Nombre del rival" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-400">Resultado</span>
          <Select name="resultado" defaultValue="victoria">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="victoria">Victoria</SelectItem>
              <SelectItem value="derrota">Derrota</SelectItem>
              <SelectItem value="empate">Empate</SelectItem>
              <SelectItem value="exhibicion">Exhibición</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-400">Método</span>
          <Campo name="metodo" placeholder="Decisión, RSC, etc." />
        </label>

        <div className="sm:col-span-2">
          <Aviso error={estado.error} ok={estado.ok} />
        </div>
        <BotonEnvio className="sm:col-span-2">Agregar al historial</BotonEnvio>
      </form>
    </details>
  );
}
