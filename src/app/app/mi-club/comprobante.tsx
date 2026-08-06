"use client";

import { useActionState, useRef, useState } from "react";
import { registrarPago, type EstadoFormulario } from "@/actions/pagos";
import { Aviso, BotonEnvio } from "@/components/ui/formulario";
import { Campo } from "@/components/ui/input";
import { prepararImagen, ImagenInvalidaError } from "@/utils/imagen";

const METODOS = [
  ["yape", "Yape"],
  ["plin", "Plin"],
  ["transferencia", "Transferencia"],
  ["efectivo", "Efectivo el día del evento"],
] as const;

/**
 * El cobro al competidor lo controla cada academia (incluye descuentos a su
 * criterio), no una pasarela: por eso el comprobante manual es la única vía,
 * revisada por el organizador. El pago con tarjeta (Culqi) queda reservado
 * al plan de sass-combate — ver `plan/selector-plan.tsx`.
 */
export function SubirComprobante({
  eventoId,
  monto,
}: {
  eventoId: string;
  monto: number;
}) {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(registrarPago, {});
  const [metodo, setMetodo] = useState<string>("yape");
  const [procesandoImagen, setProcesandoImagen] = useState(false);
  const [errorImagen, setErrorImagen] = useState<string | null>(null);
  const inputArchivoRef = useRef<HTMLInputElement>(null);

  /** Comprime la captura en el navegador (redimensiona + recomprime a JPEG)
   *  antes de que el form la mande al servidor — una foto de celular sin
   *  comprimir puede pesar 10-20MB. Reemplaza `input.files` con el archivo
   *  ya procesado vía `DataTransfer` para no tocar el flujo de Server Action
   *  existente (`registrarPago` sigue leyendo `datos.get("comprobante")` igual). */
  async function alCambiarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    setErrorImagen(null);
    if (!archivo) return;

    setProcesandoImagen(true);
    try {
      const comprimido = await prepararImagen(archivo);
      const lista = new DataTransfer();
      lista.items.add(comprimido);
      if (inputArchivoRef.current) inputArchivoRef.current.files = lista.files;
    } catch (err) {
      const mensaje = err instanceof ImagenInvalidaError ? err.message : "No se pudo procesar la imagen.";
      setErrorImagen(mensaje);
      if (inputArchivoRef.current) inputArchivoRef.current.value = "";
    } finally {
      setProcesandoImagen(false);
    }
  }

  return (
    <section className="mt-8 rounded-xl border border-borde bg-panel p-5">
      <h2 className="text-lg font-medium">Pagar inscripciones</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Total a pagar: <span className="font-medium">S/ {monto.toFixed(2)}</span>
      </p>

      <div className="mt-4 grid gap-3">
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-400">Método</span>
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

        <form action={accion} className="grid gap-3">
          <input type="hidden" name="eventoId" value={eventoId} />
          <input type="hidden" name="monto" value={monto} />
          <input type="hidden" name="metodo" value={metodo} />

          {/* `disabled` en el fieldset bloquea todos los campos (incluido el
              botón de envío) mientras se comprime la imagen, sin pisar el
              `disabled={pending}` que BotonEnvio ya maneja solo. */}
          <fieldset disabled={procesandoImagen} className="grid gap-3">
            {metodo !== "efectivo" && (
              <>
                <label className="grid gap-1 text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Número de operación</span>
                  <Campo name="referencia" placeholder="00123456" />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Captura del pago</span>
                  <input
                    ref={inputArchivoRef}
                    type="file"
                    name="comprobante"
                    accept="image/*"
                    onChange={alCambiarArchivo}
                    className="rounded-lg border border-borde bg-panel p-2 text-sm"
                  />
                  {procesandoImagen && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">Comprimiendo imagen…</span>
                  )}
                  {errorImagen && <span className="text-xs text-error">{errorImagen}</span>}
                </label>
              </>
            )}

            <Aviso error={estado.error} ok={estado.ok} />
            <BotonEnvio>Enviar comprobante</BotonEnvio>
          </fieldset>

          <p className="text-xs text-slate-400 dark:text-slate-500">
            El organizador revisa el comprobante y aprueba las inscripciones.
            Vas a ver el cambio aquí mismo.
          </p>
        </form>
      </div>
    </section>
  );
}
