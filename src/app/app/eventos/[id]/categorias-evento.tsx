"use client";

import { useActionState } from "react";
import { crearCategoria, eliminarCategoria, type EstadoFormulario } from "@/actions/eventos";
import { Aviso, BotonEnvio } from "@/components/ui/formulario";
import { Campo } from "@/components/ui/input";
import { Boton } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NOMBRE_MODALIDAD, type CategoriaPeso, type ModalidadCodigo } from "@/types";

const MODALIDADES = Object.entries(NOMBRE_MODALIDAD) as [ModalidadCodigo, string][];

function rangoTexto(c: CategoriaPeso): string {
  if (c.peso_min != null && c.peso_max != null && c.peso_min === c.peso_max) {
    return `${c.peso_min}kg exacto`;
  }
  if (c.peso_min != null && c.peso_max != null) return `${c.peso_min}–${c.peso_max}kg`;
  if (c.peso_min != null) return `desde ${c.peso_min}kg`;
  return `hasta ${c.peso_max}kg`;
}

function BotonEliminar({ eventoId, categoriaId }: { eventoId: string; categoriaId: string }) {
  const [, accion] = useActionState<EstadoFormulario, FormData>(eliminarCategoria, {});
  return (
    <form action={accion}>
      <input type="hidden" name="eventoId" value={eventoId} />
      <input type="hidden" name="categoriaId" value={categoriaId} />
      <Boton type="submit" variante="fantasma" tamano="sm">
        Eliminar
      </Boton>
    </form>
  );
}

/**
 * Categorías de peso con nombre, propias de cada evento — solo una etiqueta
 * visual (ver la nota en `CategoriaPeso`, `src/types/index.ts`): el
 * emparejador sigue cruzando por tolerancia porcentual de peso, esto no lo
 * reemplaza.
 */
export function CategoriasEvento({
  eventoId,
  categorias,
}: {
  eventoId: string;
  categorias: CategoriaPeso[];
}) {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(crearCategoria, {});

  return (
    <section className="mt-8 rounded-xl border border-borde bg-panel p-5">
      <h2 className="text-lg font-medium">Categorías de peso</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Etiqueta visual (peso pluma, -57kg, un peso exacto...) que se muestra junto al
        peso de pesaje. El emparejador sigue cruzando por tolerancia de peso, no por esto.
      </p>

      {categorias.length > 0 && (
        <ul className="mt-4 grid gap-2">
          {categorias.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-borde bg-fondo px-3 py-2 text-sm"
            >
              <span>
                <span className="font-medium">{c.nombre}</span>{" "}
                <span className="text-slate-500 dark:text-slate-400">
                  {NOMBRE_MODALIDAD[c.modalidad]}
                  {c.sexo ? ` · ${c.sexo === "M" ? "Varones" : "Mujeres"}` : ""} · {rangoTexto(c)}
                </span>
              </span>
              <BotonEliminar eventoId={eventoId} categoriaId={c.id} />
            </li>
          ))}
        </ul>
      )}

      <form action={accion} className="mt-4 grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="eventoId" value={eventoId} />
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-400">Nombre</span>
          <Campo name="nombre" placeholder="Peso pluma" required />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-400">Modalidad</span>
          <Select name="modalidad" required>
            <SelectTrigger>
              <SelectValue placeholder="Elige una modalidad" />
            </SelectTrigger>
            <SelectContent>
              {MODALIDADES.map(([codigo, nombre]) => (
                <SelectItem key={codigo} value={codigo}>
                  {nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-400">Peso mínimo (kg)</span>
          <Campo name="pesoMin" type="number" step="0.1" min="0" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-400">Peso máximo (kg)</span>
          <Campo name="pesoMax" type="number" step="0.1" min="0" />
        </label>
        <label className="grid gap-1 text-sm sm:col-span-2">
          <span className="text-slate-600 dark:text-slate-400">Sexo (opcional)</span>
          <Select name="sexo" defaultValue="todos">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Cualquiera</SelectItem>
              <SelectItem value="M">Varones</SelectItem>
              <SelectItem value="F">Mujeres</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <div className="sm:col-span-2">
          <Aviso error={estado.error} ok={estado.ok} />
        </div>
        <div className="sm:col-span-2">
          <BotonEnvio>Agregar categoría</BotonEnvio>
        </div>
      </form>
    </section>
  );
}
