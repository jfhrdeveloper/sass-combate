"use client";

import { useActionState, useState } from "react";
import { revisarPago, type EstadoFormulario } from "@/actions/pagos";
import { Aviso } from "@/components/ui/formulario";
import { Boton } from "@/components/ui/button";
import { Campo } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { aplicarDescuento, type TipoDescuento } from "@/lib/descuentos";

export function RevisarPago({ pagoId, monto }: { pagoId: string; monto: number }) {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(revisarPago, {});
  const [rechazando, setRechazando] = useState(false);
  const [conDescuento, setConDescuento] = useState(false);
  const [tipo, setTipo] = useState<TipoDescuento>("monto");
  const [valor, setValor] = useState("");

  const valorNumero = Number(valor) || 0;
  const montoConDescuento = conDescuento
    ? aplicarDescuento(monto, { tipo, valor: valorNumero })
    : monto;

  return (
    <form action={accion} className="mt-3 grid gap-2">
      <input type="hidden" name="pagoId" value={pagoId} />

      {rechazando && (
        <Campo name="motivo" placeholder="Motivo del rechazo" required />
      )}

      {!rechazando && (
        <div className="rounded-lg border border-borde p-3 text-sm">
          <button
            type="button"
            onClick={() => setConDescuento((v) => !v)}
            className="font-medium text-slate-700 underline-offset-2 hover:underline dark:text-slate-300"
          >
            {conDescuento ? "Quitar descuento" : "Agregar descuento"}
          </button>

          {conDescuento && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Select name="descuentoTipo" value={tipo} onValueChange={(v) => setTipo(v as TipoDescuento)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monto">S/ (monto fijo)</SelectItem>
                  <SelectItem value="porcentaje">% (porcentaje)</SelectItem>
                </SelectContent>
              </Select>
              <input
                type="number"
                name="descuentoValor"
                min={0}
                max={tipo === "porcentaje" ? 100 : undefined}
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder={tipo === "porcentaje" ? "10" : "20.00"}
                className="h-10 rounded-lg border border-borde bg-panel px-3 text-sm"
              />
              <p className="col-span-2 text-xs text-slate-500 dark:text-slate-400">
                Total original S/ {monto.toFixed(2)} → a cobrar{" "}
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  S/ {montoConDescuento.toFixed(2)}
                </span>
              </p>
            </div>
          )}
        </div>
      )}

      <Aviso error={estado.error} ok={estado.ok} />

      <div className="flex gap-2">
        <Boton type="submit" name="decision" value="aprobado" tamano="sm">
          Aprobar
        </Boton>
        {rechazando ? (
          <Boton type="submit" name="decision" value="rechazado" variante="roja" tamano="sm">
            Confirmar rechazo
          </Boton>
        ) : (
          <Boton
            type="button"
            variante="contorno"
            tamano="sm"
            onClick={() => setRechazando(true)}
          >
            Rechazar
          </Boton>
        )}
      </div>
    </form>
  );
}
