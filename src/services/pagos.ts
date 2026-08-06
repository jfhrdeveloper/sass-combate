import { crearClienteServidor } from "@/lib/supabase/server";
import { crearClienteServicio } from "@/lib/supabase/admin";
import { HAY_SUPABASE } from "@/lib/datos";
import { aplicarDescuento, type TipoDescuento } from "@/lib/descuentos";

export interface Pago {
  id: string;
  club: string | null;
  metodo: string;
  monto: number;
  referencia: string | null;
  comprobante_url: string | null;
  /** URL firmada y temporal para ver la imagen (el bucket `comprobantes` es
   *  privado, no tiene política de lectura propia; se firma con
   *  `service_role` porque `listarPagos()` ya filtró por RLS qué pagos puede
   *  ver este usuario, no es una lectura sin verificar de por medio). */
  comprobante_url_firmada: string | null;
  estado: "en_revision" | "aprobado" | "rechazado";
  motivo_rechazo: string | null;
  descuento_tipo: TipoDescuento | null;
  descuento_valor: number | null;
  creado_en: string;
}

/** Monto que realmente se cobra tras el descuento, si tiene uno. */
export function montoFinal(pago: Pago): number {
  if (!pago.descuento_tipo || pago.descuento_valor === null) return pago.monto;
  return aplicarDescuento(pago.monto, { tipo: pago.descuento_tipo, valor: pago.descuento_valor });
}

const DEMO: Pago[] = [
  {
    id: "pg1",
    club: "La Sexta Calle",
    metodo: "yape",
    monto: 300,
    referencia: "00123456",
    comprobante_url: null,
    comprobante_url_firmada: null,
    estado: "en_revision",
    motivo_rechazo: null,
    descuento_tipo: null,
    descuento_valor: null,
    creado_en: new Date().toISOString(),
  },
  {
    id: "pg2",
    club: "Grinta Fight",
    metodo: "transferencia",
    monto: 450,
    referencia: "88991122",
    comprobante_url: null,
    comprobante_url_firmada: null,
    estado: "aprobado",
    motivo_rechazo: null,
    descuento_tipo: "porcentaje",
    descuento_valor: 10,
    creado_en: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "pg3",
    club: "Diamond Boys",
    metodo: "plin",
    monto: 150,
    referencia: "55003321",
    comprobante_url: null,
    comprobante_url_firmada: null,
    estado: "rechazado",
    motivo_rechazo: "La captura no coincide con el monto declarado.",
    descuento_tipo: null,
    descuento_valor: null,
    creado_en: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "pg4",
    club: "Federico Gomez Iquitos",
    metodo: "efectivo",
    monto: 250,
    referencia: null,
    comprobante_url: null,
    comprobante_url_firmada: null,
    estado: "en_revision",
    motivo_rechazo: null,
    descuento_tipo: null,
    descuento_valor: null,
    creado_en: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "pg5",
    club: "Team Hapa",
    metodo: "tarjeta",
    monto: 300,
    referencia: "ch_9f2a7c",
    comprobante_url: null,
    comprobante_url_firmada: null,
    estado: "aprobado",
    motivo_rechazo: null,
    descuento_tipo: null,
    descuento_valor: null,
    creado_en: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: "pg6",
    club: "Cazorla",
    metodo: "yape",
    monto: 100,
    referencia: "00998877",
    comprobante_url: null,
    comprobante_url_firmada: null,
    estado: "en_revision",
    motivo_rechazo: null,
    descuento_tipo: null,
    descuento_valor: null,
    creado_en: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "pg7",
    club: "Dojo Boyka Fight",
    metodo: "transferencia",
    monto: 150,
    referencia: "77123456",
    comprobante_url: null,
    comprobante_url_firmada: null,
    estado: "aprobado",
    motivo_rechazo: null,
    descuento_tipo: "monto",
    descuento_valor: 15,
    creado_en: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: "pg8",
    club: "Zambrano Fight",
    metodo: "yape",
    monto: 300,
    referencia: "00112233",
    comprobante_url: null,
    comprobante_url_firmada: null,
    estado: "en_revision",
    motivo_rechazo: null,
    descuento_tipo: null,
    descuento_valor: null,
    creado_en: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: "pg9",
    club: "Kick Fighters Nasca",
    metodo: "plin",
    monto: 150,
    referencia: "99887766",
    comprobante_url: null,
    comprobante_url_firmada: null,
    estado: "rechazado",
    motivo_rechazo: "No se registró ese número de operación.",
    descuento_tipo: null,
    descuento_valor: null,
    creado_en: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
];

/** Volumen extra para revisar paginación y el gráfico de ingresos con más
 *  de un puñado de pagos — mismo criterio determinista que en `lib/datos.ts`
 *  (PRNG con semilla fija, no `Math.random()`). */
function mulberry32(semilla: number) {
  let a = semilla;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CLUBES_PAGOS = [
  "La Sexta Calle", "Grinta Fight", "Diamond Boys", "Federico Gomez Iquitos",
  "Team Hapa", "Cazorla", "Dojo Boyka Fight", "Zambrano Fight", "Kick Fighters Nasca",
  "Fenix Combat", "Warrior's Den", "Selva Fight Team", "Norte Kickboxing", "Andes MMA",
];
const METODOS_PAGO = ["yape", "plin", "transferencia", "efectivo", "tarjeta"] as const;
const rand = mulberry32(20260804);

const DEMO_GENERADOS: Pago[] = Array.from({ length: 35 }, (_, i) => {
  const n = DEMO.length + i;
  const r = rand();
  const estado: Pago["estado"] = r < 0.15 ? "en_revision" : r < 0.3 ? "rechazado" : "aprobado";
  return {
    id: `pg${n + 1}`,
    club: CLUBES_PAGOS[Math.floor(rand() * CLUBES_PAGOS.length)],
    metodo: METODOS_PAGO[Math.floor(rand() * METODOS_PAGO.length)],
    monto: Math.round((100 + rand() * 500) / 10) * 10,
    referencia: estado === "en_revision" || estado === "aprobado" ? String(10000000 + Math.floor(rand() * 89999999)) : null,
    comprobante_url: null,
    comprobante_url_firmada: null,
    estado,
    motivo_rechazo: estado === "rechazado" ? "La captura no coincide con el monto declarado." : null,
    descuento_tipo: null,
    descuento_valor: null,
    creado_en: new Date(Date.now() - Math.floor(rand() * 20) * 86400000).toISOString(),
  };
});

DEMO.push(...DEMO_GENERADOS);

export interface PuntoIngreso {
  etiqueta: string;
  fecha: string;
  monto: number;
}

/** Suma de pagos `aprobado` por día, últimos 7 días (hoy incluido). Solo lo
 *  aprobado cuenta como ingreso real — en_revision/rechazado no. */
export function resumenIngresos7Dias(pagos: Pago[]): PuntoIngreso[] {
  const dias: PuntoIngreso[] = [];
  for (let i = 6; i >= 0; i--) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - i);
    const clave = fecha.toISOString().slice(0, 10);
    dias.push({
      etiqueta: fecha.toLocaleDateString("es-PE", { weekday: "short" }).replace(".", ""),
      fecha: clave,
      monto: 0,
    });
  }

  const porFecha = new Map(dias.map((d) => [d.fecha, d]));
  for (const pago of pagos) {
    if (pago.estado !== "aprobado") continue;
    const clave = pago.creado_en.slice(0, 10);
    const punto = porFecha.get(clave);
    if (punto) punto.monto += montoFinal(pago);
  }

  return dias;
}

export async function listarPagos(): Promise<Pago[]> {
  if (!HAY_SUPABASE) return DEMO;

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("pago")
    .select(
      "id, metodo, monto, referencia, comprobante_url, estado, motivo_rechazo, descuento_tipo, descuento_valor, creado_en, club:club_id (nombre)"
    )
    .order("creado_en", { ascending: false });

  type Fila = Omit<Pago, "club" | "comprobante_url_firmada"> & { club: { nombre: string } | null };
  const filas = (data ?? []) as unknown as Fila[];

  // El bucket es privado y no tiene política de lectura propia (ver
  // docs/db-notes.md): se firma con service_role porque la fila de `pago` ya
  // pasó por RLS arriba, no es una lectura sin verificar.
  const servicio = crearClienteServicio();
  const firmadas = await Promise.all(
    filas.map((p) =>
      p.comprobante_url
        ? servicio.storage.from("comprobantes").createSignedUrl(p.comprobante_url, 3600)
        : Promise.resolve(null)
    )
  );

  return filas.map((p, i) => ({
    ...p,
    club: p.club?.nombre ?? null,
    comprobante_url_firmada: firmadas[i]?.data?.signedUrl ?? null,
  }));
}
