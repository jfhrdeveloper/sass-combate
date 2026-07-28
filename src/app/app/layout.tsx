import Link from "next/link";
import { exigirAcademia } from "@/lib/auth";
import { salir } from "@/app/acciones";
import { HAY_SUPABASE } from "@/lib/datos";

export default async function LayoutPanel({ children }: { children: React.ReactNode }) {
  const { sesion, academia } = await exigirAcademia();

  const enlaces = [
    ["Eventos", "/app"],
    ["Atletas", "/app/atletas"],
    ["Mi club", "/app/mi-club"],
    ["Pagos", "/app/pagos"],
    ["Equipo", "/app/equipo"],
  ] as const;

  return (
    <div className="min-h-screen">
      <header className="border-b border-borde bg-panel">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-6 py-3">
          <Link href="/app" className="font-semibold">
            {academia.nombre}
          </Link>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {academia.rol}
          </span>

          <nav className="flex gap-4 text-sm text-slate-600">
            {enlaces.map(([texto, href]) => (
              <Link key={href} href={href} className="hover:text-slate-900">
                {texto}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-slate-500 sm:inline">
              {sesion.nombre ?? sesion.email}
            </span>
            <form action={salir}>
              <button className="text-slate-500 underline hover:text-slate-900">Salir</button>
            </form>
          </div>
        </div>
      </header>

      {!HAY_SUPABASE && (
        <p className="bg-amber-50 px-6 py-2 text-center text-sm text-amber-900">
          Modo demo: sin variables de entorno, los datos son de ejemplo y nada se guarda.
        </p>
      )}

      {children}
    </div>
  );
}
