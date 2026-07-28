import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const estilos = cva(
  "inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variante: {
        solido: "bg-slate-900 text-white hover:bg-slate-700",
        contorno: "border border-borde bg-white hover:bg-slate-50",
        roja: "bg-roja text-white hover:opacity-90",
        azul: "bg-azul text-white hover:opacity-90",
        fantasma: "hover:bg-slate-100",
      },
      tamano: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-14 px-6 text-lg",
        mesa: "h-24 px-6 text-2xl font-semibold",
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
