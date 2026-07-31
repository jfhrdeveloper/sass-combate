import type { MetadataRoute } from "next";
import { URL_BASE } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /p/[token] es un link personal (credencial), no contenido para buscar.
        disallow: ["/app", "/mesa", "/admin", "/nueva-academia", "/api", "/p/"],
      },
    ],
    sitemap: `${URL_BASE}/sitemap.xml`,
  };
}
