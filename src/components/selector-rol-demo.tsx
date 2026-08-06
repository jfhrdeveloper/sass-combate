"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NOMBRE_ROL, type Rol } from "@/config/roles";

interface Props {
  accion: (formData: FormData) => void;
  rolActual: Rol;
  roles: readonly Rol[];
}

/** Solo modo demo: cambia el rol simulado sin recargar la página a mano. */
export function SelectorRolDemo({ accion, rolActual, roles }: Props) {
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={accion}>
      <input type="hidden" name="volver" value={pathname} />
      <Select
        name="rol"
        defaultValue={rolActual}
        onValueChange={() => formRef.current?.requestSubmit()}
      >
        <SelectTrigger className="h-7 rounded-md bg-slate-100 px-2 pr-7 text-xs text-slate-600 dark:bg-white/10 dark:text-slate-300">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {roles.map((rol) => (
            <SelectItem key={rol} value={rol}>
              {NOMBRE_ROL[rol]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </form>
  );
}
