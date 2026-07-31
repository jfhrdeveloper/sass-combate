import { ImageResponse } from "next/og";
import { EVENTO_DEMO, HAY_SUPABASE } from "@/lib/datos";
import { fechaLarga } from "@/lib/format";
import { desdeSlug } from "@/lib/seo";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ org: string; evento: string }>;
}) {
  const { org, evento } = await params;
  const nombre = HAY_SUPABASE ? desdeSlug(evento) : EVENTO_DEMO.nombre;
  const organizacion = HAY_SUPABASE ? desdeSlug(org) : "sass-combate";
  const detalle = HAY_SUPABASE ? organizacion : `${fechaLarga(EVENTO_DEMO.fecha)} · ${EVENTO_DEMO.sede}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "90px",
          background: "linear-gradient(135deg, #0b1220 0%, #131c2e 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 24,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#94a3b8",
            fontWeight: 700,
          }}
        >
          sass-combate
        </div>
        <div style={{ display: "flex", fontSize: 84, fontWeight: 700, marginTop: 20, lineHeight: 1.05 }}>
          {nombre}
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "#cbd5e1", marginTop: 24 }}>{detalle}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 48 }}>
          <div style={{ display: "flex", width: 14, height: 14, borderRadius: 999, background: "#ef4444" }} />
          <div style={{ display: "flex", fontSize: 24, color: "#94a3b8" }}>Programa en vivo, sin refrescar</div>
          <div style={{ display: "flex", width: 14, height: 14, borderRadius: 999, background: "#3b82f6" }} />
        </div>
      </div>
    ),
    { ...size }
  );
}
