import { NextResponse, type NextRequest } from "next/server";
import { generarActa, type FilaActa } from "@/lib/pdf/documentos";
import {
  AREAS_DEMO,
  BLOQUES_DEMO,
  EVENTO_DEMO,
  HAY_SUPABASE,
  PELEAS_DEMO,
  inscripcionPorId,
} from "@/lib/datos";
import { crearClienteServidor } from "@/lib/supabase/server";
import { construirAgenda } from "@/lib/horarios";
import { hora } from "@/lib/format";

export const maxDuration = 60;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const host = req.headers.get("host") ?? "localhost:3000";
  const urlBase = `${host.startsWith("localhost") ? "http" : "https"}://${host}`;

  let filas: FilaActa[] = [];
  let evento = {
    nombre: EVENTO_DEMO.nombre,
    fecha: EVENTO_DEMO.fecha,
    sede: EVENTO_DEMO.sede,
    urlBase,
  };

  if (!HAY_SUPABASE) {
    const agendas = construirAgenda(AREAS_DEMO, PELEAS_DEMO, BLOQUES_DEMO);
    filas = agendas.flatMap((ag) =>
      ag.filas
        .filter((f) => f.tipo === "pelea")
        .map((f) => {
          const p = PELEAS_DEMO.find((x) => x.id === f.id)!;
          const roja = inscripcionPorId(p.roja_id);
          const azul = inscripcionPorId(p.azul_id);
          return {
            orden: f.orden,
            hora: hora(f.inicio),
            area: ag.area.nombre,
            roja: `${roja?.nombre ?? "—"} (${roja?.club ?? ""})`,
            azul: `${azul?.nombre ?? "—"} (${azul?.club ?? ""})`,
            modalidad: roja?.modalidades[0] ?? "—",
            ganador: f.estado === "finalizada" ? (roja?.nombre ?? "—") : "—",
            metodo: f.estado === "finalizada" ? "decision" : "",
          };
        })
    );
  } else {
    const supabase = await crearClienteServidor();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "sin sesión" }, { status: 401 });

    const { data: ev } = await supabase
      .from("evento")
      .select("nombre, fecha, sede")
      .eq("id", id)
      .maybeSingle();
    if (!ev) return NextResponse.json({ error: "evento no encontrado" }, { status: 404 });
    evento = { ...ev, urlBase };

    const { data } = await supabase
      .from("v_publico_pelea")
      .select("*")
      .eq("evento_id", id)
      .order("orden");

    type Fila = {
      orden: number;
      hora_estimada: string | null;
      area: string | null;
      roja: string | null;
      club_roja: string | null;
      azul: string | null;
      club_azul: string | null;
      modalidad: string | null;
      gano: string | null;
      metodo: string | null;
    };

    filas = ((data ?? []) as Fila[]).map((f) => ({
      orden: f.orden,
      hora: f.hora_estimada ? hora(f.hora_estimada) : "—",
      area: f.area ?? "—",
      roja: `${f.roja ?? "—"} (${f.club_roja ?? ""})`,
      azul: `${f.azul ?? "—"} (${f.club_azul ?? ""})`,
      modalidad: f.modalidad ?? "—",
      ganador:
        f.gano === "roja" ? (f.roja ?? "—") : f.gano === "azul" ? (f.azul ?? "—") : "—",
      metodo: f.metodo ?? "",
    }));
  }

  const pdf = await generarActa(filas, evento);

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="acta-${id}.pdf"`,
    },
  });
}
