export type Rol = "dueno" | "admin" | "mesa" | "coach" | "juez" | "lector";

export const ROLES: Rol[] = ["dueno", "admin", "mesa", "coach", "juez", "lector"];

/** Texto legible de cada rol. Nunca renderizar el valor crudo del enum
 *  directo al usuario (sale "dueno", sin ñ ni mayúscula). */
export const NOMBRE_ROL: Record<Rol, string> = {
  dueno: "Dueño",
  admin: "Administrador",
  mesa: "Mesa de control",
  coach: "Coach",
  juez: "Juez",
  lector: "Lector",
};

export const COOKIE_ROL_DEMO = "demo_rol";

export interface CuentaDemo {
  email: string;
  password: string;
  rol: Rol;
  nombre: string;
}

/**
 * Solo existen para poder entrar por /entrar y ver el panel como cada rol
 * sin un proyecto Supabase real. No son cuentas de verdad: nunca se validan
 * contra ninguna base, solo deciden qué cookie `demo_rol` queda guardada.
 */
export const CUENTAS_DEMO: CuentaDemo[] = [
  { email: "dueno@demo.com", password: "dueno1234", rol: "dueno", nombre: "Dueño (demo)" },
  { email: "admin@demo.com", password: "admin1234", rol: "admin", nombre: "Admin (demo)" },
  { email: "mesa@demo.com", password: "mesa1234", rol: "mesa", nombre: "Mesa de control (demo)" },
  { email: "coach@demo.com", password: "coach1234", rol: "coach", nombre: "Coach (demo)" },
  { email: "juez@demo.com", password: "juez1234", rol: "juez", nombre: "Juez (demo)" },
  { email: "lector@demo.com", password: "lector1234", rol: "lector", nombre: "Lector (demo)" },
];
