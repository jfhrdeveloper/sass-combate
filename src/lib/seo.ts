import { envPublico } from "@/config/env";

const RAIZ = envPublico.NEXT_PUBLIC_DOMINIO_RAIZ;
const ES_LOCAL = RAIZ.startsWith("localhost");

/** URL raíz del sitio (dominio de marketing, sin subdominio de academia). */
export const URL_BASE = `${ES_LOCAL ? "http" : "https"}://${RAIZ}`;

/**
 * URL pública canónica de un evento. En producción cada academia vive en su
 * propio subdominio (`academia.midominio.com`, ver `src/middleware.ts`); en
 * local o sin dominio propio configurado se usa la ruta `/e/[org]/[evento]`.
 */
export function urlEvento(org: string, slug: string): string {
  if (ES_LOCAL) return `${URL_BASE}/e/${org}/${slug}`;
  return `${ES_LOCAL ? "http" : "https"}://${org}.${RAIZ}/${slug}`;
}

/** "contender-2026" -> "Contender 2026" (sin datos reales de Supabase aún, ver docs/pending-task.md). */
export function desdeSlug(slug: string): string {
  return slug
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}
