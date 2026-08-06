import { cn } from "@/utils/cn";

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
  // Resultado de una pelea individual en el historial de un atleta
  // (atletas/[id]), distinto del estado de la pelea/evento de arriba.
  victoria: "bg-exito-suave text-exito-fuerte",
  derrota: "bg-error-suave text-error-fuerte",
  empate: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300",
  exhibicion: "bg-info-suave text-info-fuerte",
  no_disputada: "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400",
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
