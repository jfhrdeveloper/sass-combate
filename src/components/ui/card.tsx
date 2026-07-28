import { cn } from "@/lib/utils";

export function Tarjeta({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl border border-borde bg-panel p-4", className)} {...props} />;
}

export function TarjetaTitulo({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-sm font-medium text-slate-500", className)} {...props} />;
}

export function TarjetaDato({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1 text-2xl font-semibold", className)} {...props} />;
}
