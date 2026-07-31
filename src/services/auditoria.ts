import { crearClienteServidor } from "@/lib/supabase/server";
import { HAY_SUPABASE } from "@/lib/datos";

/**
 * Solo lectura sobre `auditoria` (migración `20260101000003_cuentas.sql`):
 * el trigger `tr_auditar_resultado` ya graba cada insert/update/delete sobre
 * `resultado` desde el primer commit. Este servicio no escribe nada, solo
 * expone lo que ya se está grabando.
 */
export interface EntradaAuditoria {
  id: number;
  tabla: string;
  registro_id: string;
  accion: "insert" | "update" | "delete";
  antes: Record<string, unknown> | null;
  despues: Record<string, unknown> | null;
  usuario_id: string | null;
  creado_en: string;
}

const DEMO: EntradaAuditoria[] = [
  {
    id: 3,
    tabla: "resultado",
    registro_id: "pel-tatami-1-3",
    accion: "update",
    antes: { ganador_id: "ins-17", metodo: "decision" },
    despues: { ganador_id: "ins-17", metodo: "rsc" },
    usuario_id: "mesa@demo.com",
    creado_en: new Date(Date.now() - 5 * 60_000).toISOString(),
  },
  {
    id: 2,
    tabla: "resultado",
    registro_id: "pel-tatami-1-2",
    accion: "insert",
    antes: null,
    despues: { ganador_id: "ins-15", metodo: "decision" },
    usuario_id: "mesa@demo.com",
    creado_en: new Date(Date.now() - 40 * 60_000).toISOString(),
  },
  {
    id: 1,
    tabla: "resultado",
    registro_id: "pel-tatami-1-1",
    accion: "insert",
    antes: null,
    despues: { ganador_id: "ins-11", metodo: "abandono" },
    usuario_id: "mesa@demo.com",
    creado_en: new Date(Date.now() - 90 * 60_000).toISOString(),
  },
];

export async function listarAuditoria(): Promise<EntradaAuditoria[]> {
  if (!HAY_SUPABASE) return DEMO;

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("auditoria")
    .select("id, tabla, registro_id, accion, antes, despues, usuario_id, creado_en")
    .order("creado_en", { ascending: false })
    .limit(200);

  return (data ?? []) as EntradaAuditoria[];
}
