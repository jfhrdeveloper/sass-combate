import type { Metadata } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { RegistrarServiceWorker } from "@/components/registrar-sw";
import { URL_BASE } from "@/lib/seo";

/**
 * Condensada para títulos, botones y números (pesos, horas, marcador): es la
 * tipografía de tabla de posiciones/cartelera de pelea, no una elección genérica.
 * Inter para texto y datos densos (tablas de atletas y pagos), por legibilidad.
 */
const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(URL_BASE),
  title: { default: "sass-combate", template: "%s — sass-combate" },
  description: "Gestión de eventos de deportes de contacto",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Torneos" },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
  width: "device-width",
  initialScale: 1,
};

/** Aplica el tema guardado antes de pintar, para no parpadear claro→oscuro al cargar. */
const SCRIPT_TEMA = `
try {
  var t = localStorage.getItem("tema");
  var oscuro = t ? t === "oscuro" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", oscuro);
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
        <Providers>{children}</Providers>
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
