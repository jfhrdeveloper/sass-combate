import type { Metadata } from "next";
import { obtenerCredencialPorToken } from "@/services/publico";
import { hora, kg } from "@/utils/format";
import { NOMBRE_MODALIDAD } from "@/types";
import { TarjetaPelea } from "@/components/ui/tarjeta-pelea";
import { ActivarNotificaciones } from "./activar-notificaciones";

// Credencial personal por token: no es contenido para indexar ni compartir públicamente.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export const revalidate = 20;

export default async function PaginaPeleador({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const credencial = await obtenerCredencialPorToken(token);

  if (!credencial) {
    return <main className="p-8 text-center text-slate-600 dark:text-slate-400">Credencial no encontrada.</main>;
  }

  const { yo, pelea, area, fila, retrasoSeg, rival } = credencial;

  if (!pelea || !fila) {
    return (
      <main className="mx-auto max-w-sm p-6 text-center">
        <h1 className="font-display text-2xl font-semibold">{yo.nombre}</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Todavía no tienes una pelea con hora asignada.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <div className="flex items-center gap-3">
        <span className="h-10 w-1.5 shrink-0 rounded-full bg-roja" aria-hidden />
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">credencial {token}</p>
          <h1 className="font-display text-2xl font-semibold leading-none">{yo.nombre}</h1>
          <p className="text-slate-600 dark:text-slate-400">
            {yo.club} · {kg(yo.peso_pesaje)}
          </p>
        </div>
      </div>

      <section className="mt-6 rounded-xl border border-borde bg-panel p-5 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">Tu pelea</p>
        <p className="mt-1 font-display text-6xl font-semibold tabular-nums">
          {hora(fila.inicio)}
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {area?.nombre} · pelea {fila.orden}
        </p>
        {retrasoSeg > 600 && (
          <p className="mt-1 text-sm font-medium text-roja">
            va con {Math.round(retrasoSeg / 60)} min de retraso
          </p>
        )}

        <TarjetaPelea
          roja={yo.nombre}
          azul={rival?.nombre}
          tamano="md"
          className="mt-5"
        />
        <p className="mt-1 grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="text-right">{yo.club}</span>
          <span>{rival?.club}</span>
        </p>

        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          {yo.modalidades.map((m) => NOMBRE_MODALIDAD[m]).join(", ")}
          {yo.clase && ` · clase ${yo.clase}`} · {pelea.rounds}x{pelea.duracion_round_seg / 60}x
          {pelea.descanso_seg / 60}
        </p>
      </section>

      <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
        La hora es estimada y se actualiza sola. Preséntate 30 minutos antes.
      </p>

      <ActivarNotificaciones token={token} />
    </main>
  );
}
