"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { entrar, entrarConGoogle, type EstadoFormulario } from "@/app/acciones";
import { Aviso, BotonEnvio } from "@/components/ui/formulario";
import { Campo } from "@/components/ui/input";
import { Boton } from "@/components/ui/button";

function Formulario() {
  const params = useSearchParams();
  const volver = params.get("volver") ?? "/app";
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(entrar, {});

  return (
    <>
      <form action={entrarConGoogle}>
        <input type="hidden" name="volver" value={volver} />
        <Boton type="submit" variante="contorno" className="w-full">
          Continuar con Google
        </Boton>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-borde" />o<span className="h-px flex-1 bg-borde" />
      </div>

      <form action={accion} className="grid gap-3">
        <input type="hidden" name="volver" value={volver} />
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600">Correo</span>
          <Campo name="email" type="email" autoComplete="email" required />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600">Contraseña</span>
          <Campo name="password" type="password" autoComplete="current-password" required />
        </label>
        <Aviso error={estado.error} ok={estado.ok} />
        <BotonEnvio className="w-full">Entrar</BotonEnvio>
      </form>
    </>
  );
}

export default function PaginaEntrar() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center p-6">
      <h1 className="text-2xl font-semibold">Entrar</h1>
      <p className="mt-1 text-sm text-slate-600">Accede al panel de tu academia.</p>

      <div className="mt-6 rounded-xl border border-borde bg-panel p-5">
        <Suspense fallback={<p className="text-sm text-slate-500">Cargando…</p>}>
          <Formulario />
        </Suspense>
      </div>

      <p className="mt-4 text-center text-sm text-slate-600">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-medium underline">
          Crear una academia
        </Link>
      </p>
    </main>
  );
}
