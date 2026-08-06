import { crearClienteServidor } from "@/lib/supabase/server";
import { HAY_SUPABASE } from "@/lib/datos";
import { CUENTAS_DEMO, type Rol } from "@/config/roles";

export interface MiembroEquipo {
  id: string;
  usuario_id: string;
  rol: Rol;
  nombre: string | null;
  email: string | null;
  creado_en: string;
}

export interface InvitacionPendiente {
  id: string;
  email: string;
  rol: Rol;
  creada_en: string;
}

const MIEMBROS_DEMO: MiembroEquipo[] = CUENTAS_DEMO.map((c, i) => ({
  id: `demo-miembro-${i}`,
  usuario_id: `demo-${c.rol}`,
  rol: c.rol,
  nombre: c.nombre,
  email: c.email,
  creado_en: new Date(Date.now() - (i + 1) * 30 * 86400000).toISOString(),
}));

const INVITACIONES_DEMO: InvitacionPendiente[] = [
  {
    id: "demo-inv-1",
    email: "nueva-mesa@academia.com",
    rol: "mesa",
    creada_en: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

export async function listarEquipo(): Promise<MiembroEquipo[]> {
  if (!HAY_SUPABASE) return MIEMBROS_DEMO;

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("v_equipo")
    .select("id, usuario_id, rol, nombre, email, creado_en")
    .order("creado_en");

  return (data ?? []) as MiembroEquipo[];
}

export async function listarInvitacionesPendientes(): Promise<InvitacionPendiente[]> {
  if (!HAY_SUPABASE) return INVITACIONES_DEMO;

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("invitacion")
    .select("id, email, rol, creada_en")
    .is("aceptada_en", null)
    .order("creada_en");

  return (data ?? []) as InvitacionPendiente[];
}
