"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registrarse, entrarConGoogle, type EstadoFormulario } from "@/actions/cuenta";
import { Aviso, BotonEnvio } from "@/components/ui/formulario";
import { Campo } from "@/components/ui/input";
import { Boton } from "@/components/ui/button";

export default function PaginaRegistro() {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(registrarse, {});

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center p-6">
      <h1 className="text-2xl font-semibold">Crear cuenta</h1>
      <p className="mt-1 text-sm text-slate-600">
        Registra tu academia y organiza tu primer evento.
      </p>

      <div className="mt-6 rounded-xl border border-borde bg-panel p-5">
        <form action={entrarConGoogle}>
          <input type="hidden" name="volver" value="/nueva-academia" />
          <Boton type="submit" variante="contorno" className="w-full">
            Continuar con Google
          </Boton>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-borde" />o<span className="h-px flex-1 bg-borde" />
        </div>

        <form action={accion} className="grid gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600">Tu nombre</span>
            <Campo name="nombre" required />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600">Correo</span>
            <Campo name="email" type="email" autoComplete="email" required />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600">Contraseña</span>
            <Campo name="password" type="password" autoComplete="new-password" required />
            <span className="text-xs text-slate-400">Mínimo 8 caracteres</span>
          </label>
          <Aviso error={estado.error} ok={estado.ok} />
          <BotonEnvio className="w-full">Crear cuenta</BotonEnvio>
        </form>
      </div>

      <p className="mt-4 text-center text-sm text-slate-600">
        ¿Ya tienes cuenta?{" "}
        <Link href="/entrar" className="font-medium underline">
          Entrar
        </Link>
      </p>
    </main>
  );
}
