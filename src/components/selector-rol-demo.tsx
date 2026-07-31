"use client";

import { usePathname } from "next/navigation";

interface Props {
  accion: (formData: FormData) => void;
  rolActual: string;
  roles: readonly string[];
}

/** Solo modo demo: cambia el rol simulado sin recargar la página a mano. */
export function SelectorRolDemo({ accion, rolActual, roles }: Props) {
  const pathname = usePathname();

  return (
    <form action={accion}>
      <input type="hidden" name="volver" value={pathname} />
      <select
        name="rol"
        defaultValue={rolActual}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-md border border-borde bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-white/10 dark:text-slate-300"
      >
        {roles.map((rol) => (
          <option key={rol} value={rol}>
            {rol}
          </option>
        ))}
      </select>
    </form>
  );
}
