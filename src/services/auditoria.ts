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
  usuario_nombre: string | null;
  usuario_email: string | null;
  creado_en: string;
}

/** Quien hizo el cambio, para mostrar en vez del UUID crudo de `usuario_id`. */
export function nombreUsuarioAuditoria(e: EntradaAuditoria): string {
  return e.usuario_nombre || e.usuario_email || "Sistema";
}

/** Texto legible para las columnas que más aparecen en `resultado` — el resto
 *  cae al nombre de columna tal cual, mejor que nada pero no ideal. */
const NOMBRE_CAMPO: Record<string, string> = {
  ganador_id: "Ganador",
  metodo: "Método",
  metodo_victoria: "Método de victoria",
  duracion_est_seg: "Duración estimada",
  ronda: "Ronda",
  observaciones: "Observaciones",
};

export function nombreCampoAuditoria(campo: string): string {
  return NOMBRE_CAMPO[campo] ?? campo;
}

const DEMO: EntradaAuditoria[] = [
  {
    id: 3,
    tabla: "resultado",
    registro_id: "pel-tatami-1-3",
    accion: "update",
    antes: { ganador_id: "ins-17", metodo: "decision" },
    despues: { ganador_id: "ins-17", metodo: "rsc" },
    usuario_id: "demo-mesa",
    usuario_nombre: "Mesa de control (demo)",
    usuario_email: "mesa@demo.com",
    creado_en: new Date(Date.now() - 5 * 60_000).toISOString(),
  },
  {
    id: 2,
    tabla: "resultado",
    registro_id: "pel-tatami-1-2",
    accion: "insert",
    antes: null,
    despues: { ganador_id: "ins-15", metodo: "decision" },
    usuario_id: "demo-mesa",
    usuario_nombre: "Mesa de control (demo)",
    usuario_email: "mesa@demo.com",
    creado_en: new Date(Date.now() - 40 * 60_000).toISOString(),
  },
  {
    id: 1,
    tabla: "resultado",
    registro_id: "pel-tatami-1-1",
    accion: "insert",
    antes: null,
    despues: { ganador_id: "ins-11", metodo: "abandono" },
    usuario_id: "demo-mesa",
    usuario_nombre: "Mesa de control (demo)",
    usuario_email: "mesa@demo.com",
    creado_en: new Date(Date.now() - 90 * 60_000).toISOString(),
  },
];

export async function listarAuditoria(): Promise<EntradaAuditoria[]> {
  if (!HAY_SUPABASE) return DEMO;

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("v_auditoria")
    .select("id, tabla, registro_id, accion, antes, despues, usuario_id, usuario_nombre, usuario_email, creado_en")
    .order("creado_en", { ascending: false })
    .limit(200);

  return (data ?? []) as EntradaAuditoria[];
}
