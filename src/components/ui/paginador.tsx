import Link from "next/link";
import { cn } from "@/utils/cn";

interface Props {
  pagina: number;
  totalPaginas: number;
  /** Arma el href de una página dada (cada lista conserva sus propios filtros en la URL). */
  hrefPara: (pagina: number) => string;
}

/** Server Component puro (sin JS): navega por query param, ningún estado en cliente. */
export function Paginador({ pagina, totalPaginas, hrefPara }: Props) {
  if (totalPaginas <= 1) return null;

  const enPrimera = pagina <= 1;
  const enUltima = pagina >= totalPaginas;

  return (
    <nav aria-label="Paginación" className="mt-6 flex items-center justify-center gap-3 text-sm">
      <Link
        href={hrefPara(pagina - 1)}
        aria-disabled={enPrimera}
        tabIndex={enPrimera ? -1 : undefined}
        className={cn(
          "rounded-lg border border-borde px-3 py-1.5 transition-colors",
          enPrimera ? "pointer-events-none opacity-40" : "hover:bg-fondo"
        )}
      >
        Anterior
      </Link>
      <span className="tabular-nums text-slate-500 dark:text-slate-400">
        Página {pagina} de {totalPaginas}
      </span>
      <Link
        href={hrefPara(pagina + 1)}
        aria-disabled={enUltima}
        tabIndex={enUltima ? -1 : undefined}
        className={cn(
          "rounded-lg border border-borde px-3 py-1.5 transition-colors",
          enUltima ? "pointer-events-none opacity-40" : "hover:bg-fondo"
        )}
      >
        Siguiente
      </Link>
    </nav>
  );
}
