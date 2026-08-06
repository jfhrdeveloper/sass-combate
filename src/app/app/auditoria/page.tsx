import { Tarjeta, TarjetaTitulo } from "@/components/ui/card";
import { Paginador } from "@/components/ui/paginador";
import { listarAuditoria, nombreCampoAuditoria, nombreUsuarioAuditoria } from "@/services/auditoria";
import { paginar } from "@/lib/paginacion";
import { fechaHora } from "@/utils/format";
import { cn } from "@/utils/cn";

/** Mismo lenguaje de color que `Insignia` (éxito/aviso/error), con texto
 *  propio ("Creado"/"Modificado"/"Eliminado") en vez del vocabulario de
 *  estado de pelea o inscripción, que no aplica acá. */
const NOMBRE_ACCION: Record<string, { texto: string; clase: string }> = {
  insert: { texto: "Creado", clase: "bg-exito-suave text-exito-fuerte" },
  update: { texto: "Modificado", clase: "bg-aviso-suave text-aviso-fuerte" },
  delete: { texto: "Eliminado", clase: "bg-error-suave text-error-fuerte" },
};

/** Campos que cambiaron entre `antes` y `despues` — el resto de columnas no aporta al lector. */
function camposCambiados(
  antes: Record<string, unknown> | null,
  despues: Record<string, unknown> | null
): Array<[string, unknown, unknown]> {
  const claves = new Set([...(antes ? Object.keys(antes) : []), ...(despues ? Object.keys(despues) : [])]);
  const cambios: Array<[string, unknown, unknown]> = [];
  for (const clave of claves) {
    const valorAntes = antes?.[clave];
    const valorDespues = despues?.[clave];
    if (JSON.stringify(valorAntes) !== JSON.stringify(valorDespues)) {
      cambios.push([clave, valorAntes, valorDespues]);
    }
  }
  return cambios;
}

export default async function PaginaAuditoria({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const entradas = await listarAuditoria();
  const { items: visibles, pagina, totalPaginas } = paginar(entradas, Number(page) || 1);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Auditoría</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Cada cambio de resultado queda registrado solo: quién lo hizo, cuándo y qué cambió. No se puede
        editar ni borrar desde acá, es un historial, no una herramienta de corrección.
      </p>

      <ul className="mt-6 grid gap-3">
        {visibles.map((e) => {
          const accion =
            NOMBRE_ACCION[e.accion] ?? { texto: e.accion, clase: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300" };
          const cambios = camposCambiados(e.antes, e.despues);

          return (
            <Tarjeta key={e.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <TarjetaTitulo>
                    {e.tabla} · {e.registro_id.slice(0, 12)}
                  </TarjetaTitulo>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {fechaHora(e.creado_en)} · {nombreUsuarioAuditoria(e)}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-block rounded-md px-2 py-0.5 font-display text-xs font-semibold uppercase tracking-wide",
                    accion.clase
                  )}
                >
                  {accion.texto}
                </span>
              </div>

              {cambios.length > 0 && (
                <ul className="mt-3 grid gap-1 text-sm">
                  {cambios.map(([campo, antes, despues]) => (
                    <li key={campo} className="flex flex-wrap items-center gap-1.5">
                      <span className="text-slate-500 dark:text-slate-400">{nombreCampoAuditoria(campo)}:</span>
                      {antes != null && (
                        <span className="text-slate-400 line-through dark:text-slate-500">
                          {String(antes)}
                        </span>
                      )}
                      <span className="font-medium">{String(despues ?? "-")}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Tarjeta>
          );
        })}
      </ul>

      {entradas.length === 0 && (
        <div className="mt-10 rounded-xl border border-dashed border-borde p-8 text-center">
          <p className="font-medium">Sin cambios registrados todavía</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            En cuanto la mesa registre o corrija un resultado, va a aparecer acá.
          </p>
        </div>
      )}

      <Paginador
        pagina={pagina}
        totalPaginas={totalPaginas}
        hrefPara={(p) => `/app/auditoria?page=${p}`}
      />
    </main>
  );
}
