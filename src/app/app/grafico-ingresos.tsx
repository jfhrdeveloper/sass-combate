import { Tarjeta, TarjetaDato, TarjetaTitulo } from "@/components/ui/card";
import type { PuntoIngreso } from "@/services/pagos";

/**
 * Serie única (ingresos aprobados por día) → un solo tono (`exito`, ya usado
 * en toda la app para montos/estados positivos), sin leyenda — el título ya
 * nombra la serie. Barras fangosas con extremo superior redondeado, altura
 * mínima de 4px para que un día en S/0 siga siendo una barra visible y no
 * una ausencia. El tooltip nativo (`title`) es una simplificación a
 * propósito: cubre el caso de uso (ver el monto exacto de un día) sin sumar
 * una librería de gráficos para una sola vista.
 */
export function GraficoIngresos({ datos }: { datos: PuntoIngreso[] }) {
  const total = datos.reduce((acc, d) => acc + d.monto, 0);
  const max = Math.max(1, ...datos.map((d) => d.monto));

  return (
    <Tarjeta>
      <TarjetaTitulo>Ingresos · últimos 7 días</TarjetaTitulo>
      <TarjetaDato>S/ {total.toFixed(2)}</TarjetaDato>

      <div className="mt-4 flex h-28 items-end gap-2" role="img" aria-label={`Ingresos aprobados por día, total S/ ${total.toFixed(2)} en los últimos 7 días`}>
        {datos.map((d) => (
          <div key={d.fecha} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <div
              title={`${d.etiqueta}: S/ ${d.monto.toFixed(2)}`}
              className="w-full rounded-t bg-exito transition-opacity hover:opacity-80"
              style={{ height: `${Math.max(4, (d.monto / max) * 100)}%` }}
            />
            <span className="text-[10px] uppercase text-slate-400 dark:text-slate-500">{d.etiqueta}</span>
          </div>
        ))}
      </div>

      {total === 0 && (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Sin pagos aprobados en los últimos 7 días.
        </p>
      )}
    </Tarjeta>
  );
}
