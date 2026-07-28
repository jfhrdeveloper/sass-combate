"use client";

import { useActionState, useState } from "react";
import { crearAcademia, type EstadoFormulario } from "@/app/acciones";
import { Aviso, BotonEnvio } from "@/components/ui/formulario";
import { Campo } from "@/components/ui/input";

function aSlug(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function PaginaNuevaAcademia() {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(crearAcademia, {});
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const dominio = process.env.NEXT_PUBLIC_DOMINIO_RAIZ ?? "localhost:3000";
  const actual = slug || aSlug(nombre);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-6">
      <h1 className="text-2xl font-semibold">Tu academia</h1>
      <p className="mt-1 text-sm text-slate-600">
        Este es el espacio donde vivirán tus eventos, peleadores y clubes.
      </p>

      <form action={accion} className="mt-6 grid gap-4 rounded-xl border border-borde bg-panel p-5">
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600">Nombre de la academia</span>
          <Campo
            name="nombre"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Sarria Kickboxing Center"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-600">Identificador público</span>
          <Campo
            name="slug"
            required
            value={actual}
            onChange={(e) => setSlug(aSlug(e.target.value))}
            placeholder="sarria"
          />
          <span className="text-xs text-slate-400">
            Tus eventos se verán en{" "}
            <span className="font-medium text-slate-600">
              {actual || "tuacademia"}.{dominio}
            </span>
          </span>
        </label>

        <Aviso error={estado.error} ok={estado.ok} />
        <BotonEnvio className="w-full">Crear academia</BotonEnvio>

        <p className="text-xs text-slate-400">
          El identificador es difícil de cambiar después, porque los enlaces que
          compartas quedan asociados a él.
        </p>
      </form>
    </main>
  );
}
