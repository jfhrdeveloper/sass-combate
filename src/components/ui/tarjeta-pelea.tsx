import { cn } from "@/utils/cn";

const TAMANOS = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-2xl sm:text-3xl",
} as const;

/**
 * El enfrentamiento roja/azul es la firma visual de la plataforma: se repite
 * en mesa, emparejamiento, evento público y credencial, siempre con el mismo
 * gesto (roja mira hacia la derecha, azul hacia la izquierda, como en un
 * cartel de pelea real) para que se reconozca de un vistazo en cualquier pantalla.
 */
export function TarjetaPelea({
  roja,
  azul,
  tamano = "md",
  className,
}: {
  roja: string | null | undefined;
  azul: string | null | undefined;
  tamano?: keyof typeof TAMANOS;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-[1fr_auto_1fr] items-center gap-2", className)}>
      <p
        className={cn(
          "truncate text-right font-display font-semibold text-roja",
          TAMANOS[tamano]
        )}
      >
        {roja ?? "-"}
      </p>
      <span className="shrink-0 rounded-full border border-borde bg-panel px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        vs
      </span>
      <p className={cn("truncate font-display font-semibold text-azul", TAMANOS[tamano])}>
        {azul ?? "-"}
      </p>
    </div>
  );
}
