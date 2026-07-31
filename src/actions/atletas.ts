"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { crearClienteServidor } from "@/lib/supabase/server";
import { HAY_SUPABASE } from "@/lib/datos";
import type { EstadoFormulario } from "./estado";
export type { EstadoFormulario } from "./estado";

export async function registrarPeleaExterna(
  _prev: EstadoFormulario,
  datos: FormData
): Promise<EstadoFormulario> {
  const parsed = z
    .object({
      atletaId: z.string().min(1),
      fecha: z.string().min(8, "Elige una fecha"),
      evento: z.string().min(3, "Escribe el nombre del evento"),
      disciplina: z.string().min(3, "Escribe la disciplina"),
      rival: z.string().optional(),
      resultado: z.enum(["victoria", "derrota", "empate", "exhibicion"]),
      metodo: z.string().optional(),
    })
    .safeParse(Object.fromEntries(datos));

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  if (!HAY_SUPABASE) {
    return { ok: "En modo demo el historial no se guarda." };
  }

  const supabase = await crearClienteServidor();
  const { data: academias } = await supabase.from("v_mis_academias").select("id").limit(1);

  const { error } = await supabase.from("historial_pelea").insert({
    atleta_id: parsed.data.atletaId,
    organizacion_id: academias?.[0]?.id ?? null,
    fecha: parsed.data.fecha,
    evento: parsed.data.evento,
    disciplina: parsed.data.disciplina,
    rival: parsed.data.rival || null,
    resultado: parsed.data.resultado,
    metodo: parsed.data.metodo || null,
    externa: true,
  });

  if (error) return { error: "No se pudo guardar la pelea" };

  revalidatePath(`/app/atletas/${parsed.data.atletaId}`);
  return { ok: "Pelea agregada al historial" };
}
