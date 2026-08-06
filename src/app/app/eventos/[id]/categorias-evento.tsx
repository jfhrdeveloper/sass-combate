"use client";

import { useActionState, useState } from "react";
import { crearCategoria, editarCategoria, eliminarCategoria, type EstadoFormulario } from "@/actions/eventos";
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

function DialogoEditar({ eventoId, categoria }: { eventoId: string; categoria: CategoriaPeso }) {
  const [abierto, setAbierto] = useState(false);
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(editarCategoria, {});

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Boton type="button" variante="fantasma" tamano="sm">
          Editar
        </Boton>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar categoría</DialogTitle>
          <DialogDescription>
            La modalidad no se puede cambiar acá: para eso, elimina esta categoría y crea una nueva.
          </DialogDescription>
        </DialogHeader>
        <form
          action={async (datos) => {
            await accion(datos);
            setAbierto(false);
          }}
          className="grid gap-3"
        >
          <input type="hidden" name="eventoId" value={eventoId} />
          <input type="hidden" name="categoriaId" value={categoria.id} />
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600 dark:text-slate-400">Nombre</span>
            <Campo name="nombre" defaultValue={categoria.nombre} required />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600 dark:text-slate-400">Peso mínimo (kg)</span>
              <Campo name="pesoMin" type="number" step="0.1" min="0" defaultValue={categoria.peso_min ?? ""} />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600 dark:text-slate-400">Peso máximo (kg)</span>
              <Campo name="pesoMax" type="number" step="0.1" min="0" defaultValue={categoria.peso_max ?? ""} />
            </label>
          </div>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600 dark:text-slate-400">Sexo (opcional)</span>
            <Select name="sexo" defaultValue={categoria.sexo ?? "todos"}>
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
          <Aviso error={estado.error} ok={estado.ok} />
          <DialogFooter>
            <BotonEnvio>Guardar cambios</BotonEnvio>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DialogoEliminar({ eventoId, categoria }: { eventoId: string; categoria: CategoriaPeso }) {
  const [abierto, setAbierto] = useState(false);
  const [, accion] = useActionState<EstadoFormulario, FormData>(eliminarCategoria, {});

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Boton type="button" variante="fantasma" tamano="sm">
          Eliminar
        </Boton>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Eliminar &ldquo;{categoria.nombre}&rdquo;?</DialogTitle>
          <DialogDescription>
            Los peleadores que ya tenían esta categoría se quedan sin etiqueta de peso. No afecta el
            emparejador ni sus pesajes ya registrados.
          </DialogDescription>
        </DialogHeader>
        <form
          action={async (datos) => {
            await accion(datos);
            setAbierto(false);
          }}
        >
          <input type="hidden" name="eventoId" value={eventoId} />
          <input type="hidden" name="categoriaId" value={categoria.id} />
          <DialogFooter>
            <Boton type="button" variante="contorno" tamano="sm" onClick={() => setAbierto(false)}>
              Cancelar
            </Boton>
            <Boton type="submit" variante="roja" tamano="sm">
              Eliminar
            </Boton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
              <span className="flex shrink-0 items-center gap-1">
                <DialogoEditar eventoId={eventoId} categoria={c} />
                <DialogoEliminar eventoId={eventoId} categoria={c} />
              </span>
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
