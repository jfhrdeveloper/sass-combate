import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** Exportado para estilizar enlaces (`next/link`) como botón sin anidar un <button>. */
export const estilos = cva(
  "inline-flex items-center justify-center rounded-lg font-display font-semibold tracking-wide transition-colors disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variante: {
        solido:
          "bg-slate-900 text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white",
        contorno: "border border-borde bg-panel hover:bg-fondo",
        roja: "bg-roja text-white hover:opacity-90",
        azul: "bg-azul text-white hover:opacity-90",
        fantasma: "hover:bg-slate-100 dark:hover:bg-white/10",
      },
      tamano: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-base",
        lg: "h-14 px-6 text-xl",
        mesa: "h-24 px-6 text-3xl uppercase",
      },
    },
    defaultVariants: { variante: "solido", tamano: "md" },
  }
);

export type BotonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof estilos>;

export function Boton({ className, variante, tamano, ...props }: BotonProps) {
  return <button className={cn(estilos({ variante, tamano }), className)} {...props} />;
}
