import { cva } from "class-variance-authority";

/**
 * Separado de `button.tsx` a propósito: `button.tsx` es `"use client"`
 * (necesita `motion.button` de framer-motion para el feedback táctil), pero
 * `estilos()` es una función pura que varias Server Components llaman
 * directo para estilizar un `<Link>` como botón sin anidar un `<button>`
 * real — eso deja de poder llamarse desde el servidor si vive en un módulo
 * marcado `"use client"`, así que este archivo se queda sin esa directiva.
 */
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
