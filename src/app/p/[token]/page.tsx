import { AREAS_DEMO, BLOQUES_DEMO, PELEAS_DEMO, inscripcionPorId } from "@/lib/datos";
import { construirAgenda } from "@/lib/horarios";
import { hora, kg } from "@/lib/format";
import { NOMBRE_MODALIDAD } from "@/lib/types";

export const revalidate = 20;

export default async function PaginaPeleador({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const agendas = construirAgenda(AREAS_DEMO, PELEAS_DEMO, BLOQUES_DEMO);
  const fila = agendas
    .flatMap((a) => a.filas)
    .find((f) => f.tipo === "pelea" && f.estado !== "finalizada");
  const pelea = PELEAS_DEMO.find((p) => p.id === fila?.id);
  const yo = inscripcionPorId(pelea?.roja_id ?? null);
  const rival = inscripcionPorId(pelea?.azul_id ?? null);
  const area = AREAS_DEMO.find((a) => a.id === pelea?.area_id);
  const retraso = agendas.find((a) => a.area.id === area?.id)?.retrasoSeg ?? 0;

  if (!yo || !pelea || !fila) {
    return <main className="p-8 text-center text-slate-600">Credencial no encontrada.</main>;
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <p className="text-xs uppercase tracking-wide text-slate-400">credencial {token}</p>
      <h1 className="mt-1 text-2xl font-semibold">{yo.nombre}</h1>
      <p className="text-slate-600">
        {yo.club} · {kg(yo.peso_pesaje)}
      </p>

      <section className="mt-6 rounded-xl border border-borde bg-panel p-5 text-center">
        <p className="text-sm text-slate-500">Tu pelea</p>
        <p className="mt-1 text-5xl font-semibold tabular-nums">{hora(fila.inicio)}</p>
        <p className="mt-1 text-sm text-slate-500">
          {area?.nombre} · pelea {fila.orden}
        </p>
        {retraso > 600 && (
          <p className="mt-1 text-sm text-roja">
            va con {Math.round(retraso / 60)} min de retraso
          </p>
        )}
        <p className="mt-4 text-lg">
          vs <span className="font-medium">{rival?.nombre}</span>
        </p>
        <p className="text-sm text-slate-500">{rival?.club}</p>
        <p className="mt-4 text-sm text-slate-500">
          {yo.modalidades.map((m) => NOMBRE_MODALIDAD[m]).join(", ")} · clase {yo.clase} ·{" "}
          {pelea.rounds}x{pelea.duracion_round_seg / 60}x{pelea.descanso_seg / 60}
        </p>
      </section>

      <p className="mt-4 text-center text-xs text-slate-400">
        La hora es estimada y se actualiza sola. Preséntate 30 minutos antes.
      </p>
    </main>
  );
}
