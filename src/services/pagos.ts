import { crearClienteServidor } from "@/lib/supabase/server";
import { HAY_SUPABASE } from "@/lib/datos";

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
  {
    id: "pg3",
    club: "Diamond Boys",
    metodo: "plin",
    monto: 150,
    referencia: "55003321",
    comprobante_url: null,
    estado: "rechazado",
    motivo_rechazo: "La captura no coincide con el monto declarado.",
    creado_en: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "pg4",
    club: "Federico Gomez Iquitos",
    metodo: "efectivo",
    monto: 250,
    referencia: null,
    comprobante_url: null,
    estado: "en_revision",
    motivo_rechazo: null,
    creado_en: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "pg5",
    club: "Team Hapa",
    metodo: "tarjeta",
    monto: 300,
    referencia: "ch_9f2a7c",
    comprobante_url: null,
    estado: "aprobado",
    motivo_rechazo: null,
    creado_en: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: "pg6",
    club: "Cazorla",
    metodo: "yape",
    monto: 100,
    referencia: "00998877",
    comprobante_url: null,
    estado: "en_revision",
    motivo_rechazo: null,
    creado_en: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "pg7",
    club: "Dojo Boyka Fight",
    metodo: "transferencia",
    monto: 150,
    referencia: "77123456",
    comprobante_url: null,
    estado: "aprobado",
    motivo_rechazo: null,
    creado_en: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: "pg8",
    club: "Zambrano Fight",
    metodo: "yape",
    monto: 300,
    referencia: "00112233",
    comprobante_url: null,
    estado: "en_revision",
    motivo_rechazo: null,
    creado_en: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: "pg9",
    club: "Kick Fighters Nasca",
    metodo: "plin",
    monto: 150,
    referencia: "99887766",
    comprobante_url: null,
    estado: "rechazado",
    motivo_rechazo: "No se registró ese número de operación.",
    creado_en: new Date(Date.now() - 8 * 86400000).toISOString(),
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
