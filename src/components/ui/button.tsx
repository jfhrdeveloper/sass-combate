"use client";

import { forwardRef } from "react";
import type { VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/utils/cn";
import { estilos } from "./estilos-boton";

export { estilos };

export type BotonProps = HTMLMotionProps<"button"> & VariantProps<typeof estilos>;

/**
 * `forwardRef`: lo necesita Radix (`asChild` en `DialogTrigger`/`SelectTrigger`
 * y similares) para adjuntar su propio ref al `<button>` real sin anidarlo
 * dentro de otro elemento interactivo.
 *
 * `motion.button` en vez de `<button>` nativo: da el mismo feedback táctil
 * (`whileTap`) a cada botón del proyecto de una sola vez, sin tocar cada
 * pantalla. Respeta `prefers-reduced-motion` solo, vía `MotionConfig
 * reducedMotion="user"` en `src/app/providers.tsx` — no hace falta
 * chequearlo acá. `whileHover` queda fuera a propósito en `mesa`/`lg`: son
 * los tamaños pensados para dedo/guante, no para mouse.
 */
export const Boton = forwardRef<HTMLButtonElement, BotonProps>(function Boton(
  { className, variante, tamano, whileTap, whileHover, ...props },
  ref
) {
  const grande = tamano === "mesa" || tamano === "lg";
  return (
    <motion.button
      ref={ref}
      className={cn(estilos({ variante, tamano }), className)}
      whileTap={whileTap ?? (props.disabled ? undefined : { scale: 0.96 })}
      whileHover={whileHover ?? (grande || props.disabled ? undefined : { scale: 1.02 })}
      transition={{ duration: 0.12 }}
      {...props}
    />
  );
});
