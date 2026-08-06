import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { RegistrarServiceWorker } from "@/components/registrar-sw";
import { URL_BASE } from "@/lib/seo";

/**
 * Una sola familia (Poppins) cubre los dos roles que ya existían
 * (`--font-display`/`--font-body`, usados en todo el proyecto vía
 * `font-display`/`font-body` de Tailwind): la jerarquía entre título y
 * cuerpo de texto ahora se marca con el grosor, no con dos tipografías
 * distintas. Poppins no es una fuente variable (a diferencia de Inter, que
 * se cargaba antes sin lista de grosores): cada grosor es un archivo
 * estático aparte, así que se listan solo los que el proyecto ya usa (grep
 * de `font-(normal|medium|semibold)` en todo `src/`), sin cargar peso de más.
 */
const display = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const body = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(URL_BASE),
  title: { default: "sass-combate", template: "%s · sass-combate" },
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
