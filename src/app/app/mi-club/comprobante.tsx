"use client";

import { useActionState, useState } from "react";
import { registrarPago, type EstadoFormulario } from "@/actions/pagos";
import { Aviso, BotonEnvio } from "@/components/ui/formulario";
import { Campo } from "@/components/ui/input";
import { PagoTarjeta } from "./pago-tarjeta";

const METODOS = [
  ["yape", "Yape"],
  ["plin", "Plin"],
  ["transferencia", "Transferencia"],
  ["efectivo", "Efectivo el día del evento"],
  ["tarjeta", "Tarjeta"],
] as const;

/**
 * En Perú la mayoría paga por Yape con una captura, así que el comprobante
 * manual es el camino principal y no una excepción. La tarjeta es la única
 * vía que no pasa por revisión manual: la pasarela aprueba al instante.
 */
export function SubirComprobante({
  eventoId,
  monto,
  email,
}: {
  eventoId: string;
  monto: number;
  email: string;
}) {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(registrarPago, {});
  const [metodo, setMetodo] = useState<string>("yape");

  return (
    <section className="mt-8 rounded-xl border border-borde bg-panel p-5">
      <h2 className="text-lg font-medium">Pagar inscripciones</h2>
      <p className="mt-1 text-sm text-slate-600">
        Total a pagar: <span className="font-medium">S/ {monto.toFixed(2)}</span>
      </p>

      <div className="mt-4 grid gap-3">
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600">Método</span>
          <select
            value={metodo}
            onChange={(e) => setMetodo(e.target.value)}
            className="h-10 rounded-lg border border-borde bg-panel px-3 text-sm"
          >
            {METODOS.map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </label>

        {metodo === "tarjeta" ? (
          <PagoTarjeta eventoId={eventoId} monto={monto} email={email} />
        ) : (
          <form action={accion} className="grid gap-3">
            <input type="hidden" name="eventoId" value={eventoId} />
            <input type="hidden" name="monto" value={monto} />
            <input type="hidden" name="metodo" value={metodo} />

            {metodo !== "efectivo" && (
              <>
                <label className="grid gap-1 text-sm">
                  <span className="text-slate-600">Número de operación</span>
                  <Campo name="referencia" placeholder="00123456" />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-slate-600">Captura del pago</span>
                  <input
                    type="file"
                    name="comprobante"
                    accept="image/*"
                    className="rounded-lg border border-borde bg-panel p-2 text-sm"
                  />
                </label>
              </>
            )}

            <Aviso error={estado.error} ok={estado.ok} />
            <BotonEnvio>Enviar comprobante</BotonEnvio>

            <p className="text-xs text-slate-400">
              El organizador revisa el comprobante y aprueba las inscripciones.
              Vas a ver el cambio aquí mismo.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
