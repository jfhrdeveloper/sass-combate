import type { Metadata } from "next";

// La mesa de control es una herramienta operativa privada, no contenido público.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function LayoutMesa({ children }: { children: React.ReactNode }) {
  return children;
}
