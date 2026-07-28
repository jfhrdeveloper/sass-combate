import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { RegistrarServiceWorker } from "@/components/registrar-sw";

export const metadata: Metadata = {
  title: "Torneos de combate",
  description: "Gestión de eventos de deportes de contacto",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Torneos" },
};

export const viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
