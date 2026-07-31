import { cn } from "@/utils/cn";

export function Campo({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-borde bg-panel px-3 text-sm outline-none focus:border-slate-400 dark:focus:border-slate-500",
        className
      )}
      {...props}
    />
  );
}

export function AreaTexto({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg border border-borde bg-panel px-3 py-2 text-sm outline-none focus:border-slate-400 dark:focus:border-slate-500",
        className
      )}
      {...props}
    />
  );
}
