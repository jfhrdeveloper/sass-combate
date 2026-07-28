import { cn } from "@/lib/utils";

const colores: Record<string, string> = {
  pendiente: "bg-slate-100 text-slate-700",
  lista: "bg-amber-100 text-amber-800",
  en_curso: "bg-emerald-100 text-emerald-800",
  finalizada: "bg-slate-900 text-white",
  cancelada: "bg-rose-100 text-rose-800",
};

export function Insignia({ estado, className }: { estado: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-md px-2 py-0.5 text-xs font-medium",
        colores[estado] ?? colores.pendiente,
        className
      )}
    >
      {estado.replace("_", " ")}
    </span>
  );
}
