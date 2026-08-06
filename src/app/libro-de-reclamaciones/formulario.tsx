"use client";

import { useActionState, useState } from "react";
import { enviarReclamo, type EstadoFormulario } from "@/actions/reclamos";
import { Aviso, BotonEnvio } from "@/components/ui/formulario";
import { Campo, AreaTexto } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function FormularioReclamo() {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(enviarReclamo, {});
  const [esMenorEdad, setEsMenorEdad] = useState(false);

  if (estado.ok) {
    return (
      <div className="rounded-xl border border-borde bg-exito-suave p-6 text-exito-fuerte">
        <p className="font-display text-lg font-semibold">Reclamo registrado</p>
        <p className="mt-1 text-sm">{estado.ok}</p>
      </div>
    );
  }

  return (
    <form action={accion} className="grid gap-6">
      <section className="grid gap-3">
        <h2 className="font-display text-lg font-semibold">1. Tipo</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 rounded-lg border border-borde bg-panel px-3 py-2 text-sm">
            <input type="radio" name="tipo" value="reclamo" defaultChecked required />
            <span>
              <span className="font-medium">Reclamo</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                Disconformidad con el plan o servicio en sí.
              </span>
            </span>
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-borde bg-panel px-3 py-2 text-sm">
            <input type="radio" name="tipo" value="queja" required />
            <span>
              <span className="font-medium">Queja</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                Disconformidad con la atención, no con el servicio.
              </span>
            </span>
          </label>
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="font-display text-lg font-semibold">2. Datos del consumidor</h2>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Nombre completo</span>
          <Campo name="consumidorNombre" required />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600 dark:text-slate-300">Tipo de documento</span>
            <Select name="documentoTipo" defaultValue="dni">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dni">DNI</SelectItem>
                <SelectItem value="ce">Carné de extranjería</SelectItem>
                <SelectItem value="pasaporte">Pasaporte</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600 dark:text-slate-300">Número de documento</span>
            <Campo name="documentoNumero" required />
          </label>
        </div>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Domicilio</span>
          <Campo name="consumidorDomicilio" required />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600 dark:text-slate-300">Correo</span>
            <Campo name="consumidorCorreo" type="email" required />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600 dark:text-slate-300">Teléfono (opcional)</span>
            <Campo name="consumidorTelefono" type="tel" />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            name="esMenorEdad"
            checked={esMenorEdad}
            onChange={(e) => setEsMenorEdad(e.target.checked)}
          />
          El consumidor es menor de edad
        </label>
        {esMenorEdad && (
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600 dark:text-slate-300">
              Nombre del padre, madre o tutor
            </span>
            <Campo name="tutorNombre" required={esMenorEdad} />
          </label>
        )}
      </section>

      <section className="grid gap-3">
        <h2 className="font-display text-lg font-semibold">3. Detalle</h2>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Plan o servicio contratado</span>
          <Campo name="bienOServicio" placeholder="Ej. Plan Por evento" required />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Monto reclamado, en soles (opcional)</span>
          <Campo name="montoReclamado" type="number" min="0" step="0.01" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Describe lo ocurrido</span>
          <AreaTexto name="detalle" rows={4} required />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-300">¿Qué solicitas?</span>
          <AreaTexto name="pedido" rows={2} required />
        </label>
      </section>

      <Aviso error={estado.error} />
      <BotonEnvio>Enviar</BotonEnvio>
      <p className="text-xs text-slate-400 dark:text-slate-500">
        La formulación del reclamo no impide acudir a otras vías de solución de
        controversias ni es requisito previo para interponer una denuncia ante
        el INDECOPI.
      </p>
    </form>
  );
}
