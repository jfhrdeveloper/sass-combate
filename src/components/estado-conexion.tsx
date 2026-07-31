"use client";

import type { EstadoSync } from "@/hooks/use-sincronizacion";

const ESTILOS: Record<EstadoSync, { fondo: string; texto: string; punto: string }> = {
  sin_conexion: {
    fondo: "bg-aviso-suave",
    texto: "text-aviso-fuerte",
    punto: "bg-aviso animate-pulse",
  },
  sincronizando: {
    fondo: "bg-info-suave",
    texto: "text-info-fuerte",
    punto: "bg-info animate-ping",
  },
  sincronizado: {
    fondo: "bg-exito-suave",
    texto: "text-exito-fuerte",
    punto: "bg-exito",
  },
  con_errores: {
    fondo: "bg-error-suave",
    texto: "text-error-fuerte",
    punto: "bg-error animate-pulse",
  },
};

function etiqueta(estado: EstadoSync, pendientes: number): string {
  switch (estado) {
    case "sin_conexion":
      return pendientes > 0
        ? `Sin conexión · ${pendientes} guardado${pendientes === 1 ? "" : "s"} aquí`
        : "Sin conexión · puedes seguir trabajando";
    case "sincronizando":
      return `Sincronizando ${pendientes}…`;
    case "con_errores":
      return `${pendientes} sin enviar · reintentando`;
    case "sincronizado":
      return "Todo sincronizado";
  }
}

export function EstadoConexion({
  estado,
  pendientes,
  ultimaSync,
  onReintentar,
}: {
  estado: EstadoSync;
  pendientes: number;
  ultimaSync?: Date | null;
  onReintentar?: () => void;
}) {
  const e = ESTILOS[estado];

  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium ${e.fondo} ${e.texto}`}
      role="status"
      aria-live="polite"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className={`absolute inline-flex h-full w-full rounded-full ${e.punto}`} />
        {estado === "sincronizando" && (
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-info" />
        )}
      </span>

      <span>{etiqueta(estado, pendientes)}</span>

      {estado === "sincronizado" && ultimaSync && (
        <span className="hidden text-xs font-normal opacity-70 sm:inline">
          {ultimaSync.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
        </span>
      )}

      {estado === "con_errores" && onReintentar && (
        <button onClick={onReintentar} className="ml-1 text-xs underline">
          reintentar
        </button>
      )}
    </div>
  );
}

/** Franja fija para pantallas donde el estado debe verse siempre. */
export function BarraConexion(props: Parameters<typeof EstadoConexion>[0]) {
  if (props.estado === "sincronizado" && props.pendientes === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-3">
      <EstadoConexion {...props} />
    </div>
  );
}
