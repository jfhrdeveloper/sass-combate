import { cn } from "@/utils/cn";

/** `h-full` para que todas las tarjetas de un mismo grid/fila queden a la
 *  misma altura aunque su contenido varíe en largo (el grid ya estira la
 *  celda; esto asegura que la tarjeta en sí llene esa celda). */
export function Tarjeta({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("h-full rounded-xl border border-borde bg-panel p-4", className)} {...props} />;
}

export function TarjetaTitulo({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-sm font-medium text-slate-500 dark:text-slate-400", className)}
      {...props}
    />
  );
}

export function TarjetaDato({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("mt-1 font-display text-3xl font-semibold tabular-nums", className)}
      {...props}
    />
  );
}
