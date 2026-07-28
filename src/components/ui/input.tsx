import { cn } from "@/lib/utils";

export function Campo({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-borde bg-white px-3 text-sm outline-none focus:border-slate-400",
        className
      )}
      {...props}
    />
  );
}
