import { cn } from "@/lib/utils";

const colores: Record<string, string> = {
  pendiente: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300",
  lista: "bg-aviso-suave text-aviso-fuerte",
  en_curso: "bg-exito-suave text-exito-fuerte",
  finalizada: "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900",
  cancelada: "bg-error-suave text-error-fuerte",
  // Estados de evento (evento.estado), distintos de los de pelea de arriba.
  borrador: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300",
  inscripciones: "bg-info-suave text-info-fuerte",
  pesaje: "bg-aviso-suave text-aviso-fuerte",
  programado: "bg-info-suave text-info-fuerte",
  finalizado: "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900",
};

export function Insignia({ estado, className }: { estado: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-md px-2 py-0.5 font-display text-xs font-semibold uppercase tracking-wide",
        colores[estado] ?? colores.pendiente,
        className
      )}
    >
      {estado.replace("_", " ")}
    </span>
  );
}
