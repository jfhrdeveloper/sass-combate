import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "sass-combate — Tu torneo, sin el Excel";

/** Imagen que se ve al compartir el link de la landing (WhatsApp, Twitter, etc.). */
export default async function Image() {
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
            fontSize: 26,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#94a3b8",
            fontWeight: 700,
          }}
        >
          Para academias de deportes de contacto
        </div>
        <div style={{ display: "flex", fontSize: 96, fontWeight: 700, marginTop: 24, lineHeight: 1.02 }}>
          Tu torneo, sin el Excel
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 28, marginTop: 56 }}>
          <div style={{ display: "flex", fontSize: 46, fontWeight: 700, color: "#f87171" }}>
            J. Zárate
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 700,
              color: "#94a3b8",
              border: "2px solid #334155",
              borderRadius: 999,
              padding: "6px 18px",
              textTransform: "uppercase",
            }}
          >
            vs
          </div>
          <div style={{ display: "flex", fontSize: 46, fontWeight: 700, color: "#60a5fa" }}>
            M. Quispe
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
