"use client";

import { useFormStatus } from "react-dom";
import { Boton, type BotonProps } from "./button";

export function BotonEnvio({ children, ...props }: BotonProps) {
  const { pending } = useFormStatus();
  return (
    <Boton type="submit" disabled={pending} {...props}>
      {pending ? "Un momento…" : children}
    </Boton>
  );
}

export function Aviso({ error, ok }: { error?: string; ok?: string }) {
  if (!error && !ok) return null;
  return (
    <p
      className={`rounded-lg px-3 py-2 text-sm ${
        error ? "bg-error-suave text-error-fuerte" : "bg-exito-suave text-exito-fuerte"
      }`}
    >
      {error ?? ok}
    </p>
  );
}
