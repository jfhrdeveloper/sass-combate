import Dexie, { type Table } from "dexie";

export type TipoOperacion = "resultado" | "pesaje" | "inscripcion" | "asistencia";

export interface Operacion {
  id?: number;
  /** Clave de idempotencia: si se reenvía, el servidor la reconoce y no duplica. */
  clave: string;
  tipo: TipoOperacion;
  eventoId: string;
  datos: Record<string, unknown>;
  creadaEn: string;
  intentos: number;
  ultimoError?: string;
  estado: "pendiente" | "enviando" | "enviada" | "fallida";
}

/** Copia local de lo que la mesa necesita para trabajar sin señal. */
export interface Cache {
  clave: string;
  valor: unknown;
  guardadoEn: string;
}

class BaseLocal extends Dexie {
  operaciones!: Table<Operacion, number>;
  cache!: Table<Cache, string>;

  constructor() {
    super("sass-combate");
    this.version(1).stores({
      operaciones: "++id, clave, estado, eventoId, creadaEn",
      cache: "clave",
    });
  }
}

let instancia: BaseLocal | null = null;

/** Devuelve null en el servidor, donde IndexedDB no existe. */
export function baseLocal(): BaseLocal | null {
  if (typeof window === "undefined") return null;
  instancia ??= new BaseLocal();
  return instancia;
}

export function nuevaClave(tipo: TipoOperacion, referencia: string): string {
  return `${tipo}:${referencia}:${Date.now().toString(36)}`;
}

export async function encolar(
  op: Omit<Operacion, "id" | "creadaEn" | "intentos" | "estado">
): Promise<void> {
  const db = baseLocal();
  if (!db) return;
  await db.operaciones.add({
    ...op,
    creadaEn: new Date().toISOString(),
    intentos: 0,
    estado: "pendiente",
  });
}

export async function pendientes(eventoId?: string): Promise<Operacion[]> {
  const db = baseLocal();
  if (!db) return [];
  const todas = await db.operaciones
    .where("estado")
    .anyOf("pendiente", "fallida")
    .toArray();
  return eventoId ? todas.filter((o) => o.eventoId === eventoId) : todas;
}

export async function marcarEnviada(id: number): Promise<void> {
  const db = baseLocal();
  if (!db) return;
  await db.operaciones.update(id, { estado: "enviada" });
}

export async function marcarFallida(id: number, error: string): Promise<void> {
  const db = baseLocal();
  if (!db) return;
  const op = await db.operaciones.get(id);
  await db.operaciones.update(id, {
    estado: "fallida",
    intentos: (op?.intentos ?? 0) + 1,
    ultimoError: error,
  });
}

export async function limpiarEnviadas(): Promise<void> {
  const db = baseLocal();
  if (!db) return;
  await db.operaciones.where("estado").equals("enviada").delete();
}

export async function guardarCache(clave: string, valor: unknown): Promise<void> {
  const db = baseLocal();
  if (!db) return;
  await db.cache.put({ clave, valor, guardadoEn: new Date().toISOString() });
}

export async function leerCache<T>(clave: string): Promise<T | null> {
  const db = baseLocal();
  if (!db) return null;
  const fila = await db.cache.get(clave);
  return (fila?.valor as T) ?? null;
}
