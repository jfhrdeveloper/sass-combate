import { Trophy, Users, Building2, Wallet, UserCog, CreditCard, History, type LucideIcon } from "lucide-react";
import type { Rol } from "./roles";

export interface ItemNavApp {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Rol[];
}

/**
 * Fuente única de la navegación de /app — la usan tanto el sidebar de
 * escritorio (sidebar-app.tsx) como la barra inferior de mobile
 * (bottom-nav-app.tsx), para no mantener dos listas desincronizadas.
 *
 * `roles` es solo comodidad de navegación (ocultar lo que no aplica),
 * igual que el resto de los chequeos de rol del proyecto — la autorización
 * real vive en RLS de Postgres, nunca acá. Entrar directo a la URL de una
 * sección oculta no está bloqueado por esto.
 */
export const NAV_APP: ItemNavApp[] = [
  { href: "/app", label: "Eventos", icon: Trophy, roles: ["dueno", "admin", "mesa", "coach", "juez", "lector"] },
  { href: "/app/atletas", label: "Atletas", icon: Users, roles: ["dueno", "admin", "mesa", "coach"] },
  { href: "/app/mi-club", label: "Mi club", icon: Building2, roles: ["dueno", "admin", "coach"] },
  { href: "/app/pagos", label: "Pagos", icon: Wallet, roles: ["dueno", "admin"] },
  { href: "/app/equipo", label: "Equipo", icon: UserCog, roles: ["dueno", "admin"] },
  { href: "/app/plan", label: "Plan", icon: CreditCard, roles: ["dueno", "admin"] },
  { href: "/app/auditoria", label: "Auditoría", icon: History, roles: ["dueno", "admin"] },
];

export function navParaRol(rol: Rol): ItemNavApp[] {
  return NAV_APP.filter((item) => item.roles.includes(rol));
}

export function esRutaActiva(pathname: string, href: string): boolean {
  return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}
