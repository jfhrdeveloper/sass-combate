import type { MetadataRoute } from "next";
import { URL_BASE, urlEvento } from "@/lib/seo";
import { HAY_SUPABASE } from "@/lib/datos";
import { crearClienteServidor } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const estaticas: MetadataRoute.Sitemap = [
    { url: URL_BASE, changeFrequency: "weekly", priority: 1 },
    { url: `${URL_BASE}/registro`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${URL_BASE}/entrar`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${URL_BASE}/terminos`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${URL_BASE}/privacidad`, changeFrequency: "yearly", priority: 0.2 },
  ];

  if (!HAY_SUPABASE) return estaticas;

  // v_publico_pelea ya filtra por evento.publico y está abierta a "anon".
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("v_publico_pelea").select("organizacion_slug, evento_slug");

  const vistos = new Set<string>();
  const eventos: MetadataRoute.Sitemap = [];
  for (const fila of data ?? []) {
    const clave = `${fila.organizacion_slug}/${fila.evento_slug}`;
    if (!fila.organizacion_slug || !fila.evento_slug || vistos.has(clave)) continue;
    vistos.add(clave);
    eventos.push({
      url: urlEvento(fila.organizacion_slug, fila.evento_slug),
      changeFrequency: "hourly",
      priority: 0.8,
    });
  }

  return [...estaticas, ...eventos];
}
