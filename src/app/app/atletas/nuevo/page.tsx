import Link from "next/link";
import { Boton } from "@/components/ui/button";
import { estilos } from "@/components/ui/estilos-boton";
import { Campo } from "@/components/ui/input";
import { buscarPeleadorPorDocumento } from "@/services/atletas";
import { BuscarOtrasAcademias } from "../buscar-otras-academias";
import { FormularioNuevoPeleador } from "./formulario";

export default async function PaginaNuevoPeleador({
  searchParams,
}: {
  searchParams: Promise<{ documento?: string }>;
}) {
  const { documento } = await searchParams;
  const encontrado = documento ? await buscarPeleadorPorDocumento(documento) : null;

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold">Agregar peleador</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Busca primero por documento, para no cargarlo dos veces si ya está en tu academia.
      </p>

      <form className="mt-6 flex gap-2">
        <Campo name="documento" defaultValue={documento ?? ""} placeholder="DNI o carné" required />
        <Boton type="submit">Buscar</Boton>
      </form>

      {documento && encontrado && (
        <div className="mt-6 rounded-xl border border-borde bg-panel p-4">
          <p className="font-medium">Ya está registrado en tu academia</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {encontrado.nombres} {encontrado.apellidos} · DNI {encontrado.documento}
          </p>
          <Link
            href={`/app/atletas/${encontrado.id}`}
            className={`${estilos({ tamano: "sm", variante: "contorno" })} mt-3`}
          >
            Ver su ficha
          </Link>
        </div>
      )}

      {documento && !encontrado && (
        <div className="mt-6">
          <p className="rounded-lg bg-aviso-suave px-3 py-2 text-sm text-aviso-fuerte">
            No está registrado en tu academia todavía. Cárgalo acá.
          </p>
          <FormularioNuevoPeleador documento={documento} />
          <div className="mt-4">
            <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
              ¿Sospechás que ya compitió en otra academia? Podés confirmarlo antes de cargarlo.
            </p>
            <BuscarOtrasAcademias documento={documento} />
          </div>
        </div>
      )}
    </main>
  );
}
