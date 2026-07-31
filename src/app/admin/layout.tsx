import { redirect } from "next/navigation";
import { esStaff, sesionActual } from "@/services/auth";
import { salir } from "@/actions/cuenta";
import Link from "next/link";

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const sesion = await sesionActual();
  if (!sesion) redirect("/entrar");
  if (!(await esStaff())) redirect("/app");

  return (
    <div className="min-h-screen">
      <header className="border-b border-borde bg-slate-900 text-white">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-3">
          <Link href="/admin" className="font-semibold">
            Plataforma
          </Link>
          <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs">staff</span>
          <nav className="flex gap-4 text-sm">
            <Link href="/admin" className="opacity-70 hover:opacity-100">
              Academias
            </Link>
            <Link href="/admin/reclamos" className="opacity-70 hover:opacity-100">
              Reclamos
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden opacity-70 sm:inline">{sesion.email}</span>
            <form action={salir}>
              <button className="underline opacity-70 hover:opacity-100">Salir</button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
