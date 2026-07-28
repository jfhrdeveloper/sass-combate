import Link from "next/link";
import { Campo } from "@/components/ui/input";
import { buscarAtletas } from "@/lib/atletas";
import { ETIQUETA_NIVEL, nivelPorPeleas } from "@/lib/nivel";

export default async function PaginaAtletas({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const atletas = await buscarAtletas(q ?? "");

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Atletas</h1>
      <p className="mt-1 text-sm text-slate-600">
        Registro compartido entre academias. Busca por documento o nombre antes
        de inscribir a alguien: si ya compitió, su nivel sale de aquí.
      </p>

      <form className="mt-6">
        <Campo name="q" defaultValue={q ?? ""} placeholder="DNI o nombre…" />
      </form>

      <ul className="mt-6 grid gap-2">
        {atletas.map((a) => {
          const sugerido = nivelPorPeleas(a.peleas);
          return (
            <li key={a.id}>
              <Link
                href={`/app/atletas/${a.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-borde bg-panel px-4 py-3 hover:border-slate-400"
              >
                <span className="min-w-0">
                  <span className="font-medium">
                    {a.nombres} {a.apellidos}
                  </span>
                  <span className="block text-xs text-slate-500">
                    DNI {a.documento}
                    {a.disciplinas?.length ? ` · ${a.disciplinas.join(", ")}` : ""}
                  </span>
                </span>

                <span className="flex items-center gap-3 text-sm">
                  <span className="tabular-nums text-slate-600">
                    {a.victorias}-{a.derrotas}
                    {a.empates ? `-${a.empates}` : ""}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs">
                    {ETIQUETA_NIVEL[sugerido]}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {atletas.length === 0 && (
        <div className="mt-10 rounded-xl border border-dashed border-borde p-8 text-center">
          <p className="font-medium">Sin resultados</p>
          <p className="mt-1 text-sm text-slate-500">
            {q
              ? "Nadie con ese documento o nombre. Se registrará como debutante."
              : "Escribe un documento o nombre para buscar."}
          </p>
        </div>
      )}

      <p className="mt-8 text-xs text-slate-400">
        Ves el resumen de peleas de cualquier atleta, pero el detalle de cada
        evento solo lo ve la academia que lo registró.
      </p>
    </main>
  );
}
