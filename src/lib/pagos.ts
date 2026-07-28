import { crearClienteServidor } from "./supabase/server";
import { HAY_SUPABASE } from "./datos";

export interface Pago {
  id: string;
  club: string | null;
  metodo: string;
  monto: number;
  referencia: string | null;
  comprobante_url: string | null;
  estado: "en_revision" | "aprobado" | "rechazado";
  motivo_rechazo: string | null;
  creado_en: string;
}

const DEMO: Pago[] = [
  {
    id: "pg1",
    club: "La Sexta Calle",
    metodo: "yape",
    monto: 300,
    referencia: "00123456",
    comprobante_url: null,
    estado: "en_revision",
    motivo_rechazo: null,
    creado_en: new Date().toISOString(),
  },
  {
    id: "pg2",
    club: "Grinta Fight",
    metodo: "transferencia",
    monto: 450,
    referencia: "88991122",
    comprobante_url: null,
    estado: "aprobado",
    motivo_rechazo: null,
    creado_en: new Date(Date.now() - 86400000).toISOString(),
  },
];

export async function listarPagos(): Promise<Pago[]> {
  if (!HAY_SUPABASE) return DEMO;

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("pago")
    .select("id, metodo, monto, referencia, comprobante_url, estado, motivo_rechazo, creado_en, club:club_id (nombre)")
    .order("creado_en", { ascending: false });

  type Fila = Omit<Pago, "club"> & { club: { nombre: string } | null };

  return ((data ?? []) as unknown as Fila[]).map((p) => ({
    ...p,
    club: p.club?.nombre ?? null,
  }));
}
