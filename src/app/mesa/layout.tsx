import { redirect } from "next/navigation";
import { misAcademias, puede, sesionActual } from "@/lib/auth";

/**
 * La mesa registra resultados, así que exige rol de mesa o superior.
 * Un lector o un juez no debe poder cerrar una pelea.
 */
export default async function LayoutMesa({ children }: { children: React.ReactNode }) {
  const sesion = await sesionActual();
  if (!sesion) redirect("/entrar");

  const academias = await misAcademias();
  if (academias.length === 0) redirect("/nueva-academia");
  if (!puede(academias[0].rol, "mesa")) redirect("/app");

  return <>{children}</>;
}
