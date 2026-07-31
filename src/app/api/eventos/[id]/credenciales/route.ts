import { NextResponse, type NextRequest } from "next/server";
import { generarCredenciales, type Credencial } from "@/lib/pdf/documentos";
import { EVENTO_DEMO, INSCRIPCIONES_DEMO, HAY_SUPABASE } from "@/lib/datos";
import { crearClienteServidor } from "@/lib/supabase/server";
import { NOMBRE_MODALIDAD } from "@/types";

export const maxDuration = 60;

/**
 * Genera el PDF de credenciales por lotes.
 *
 * Con 300 peleadores todo de golpe agota el tiempo de la función, así que se
 * pagina con ?desde= y ?cuantos=. El valor por defecto (60) entra cómodo.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const desde = Number(req.nextUrl.searchParams.get("desde") ?? 0);
  const cuantos = Math.min(Number(req.nextUrl.searchParams.get("cuantos") ?? 60), 120);

  const host = req.headers.get("host") ?? "localhost:3000";
  const urlBase = `${host.startsWith("localhost") ? "http" : "https"}://${host}`;

  let credenciales: Credencial[] = [];
  let evento = {
    nombre: EVENTO_DEMO.nombre,
    fecha: EVENTO_DEMO.fecha,
    sede: EVENTO_DEMO.sede,
    urlBase,
  };

  if (!HAY_SUPABASE) {
    credenciales = INSCRIPCIONES_DEMO.map((i, n) => ({
      token: `demo${String(n + 1).padStart(4, "0")}`,
      nombre: i.nombre,
      club: i.club,
      categoria: i.modalidades.map((m) => NOMBRE_MODALIDAD[m]).join(", ") || "—",
      peso: i.peso_pesaje ? `${i.peso_pesaje} kg` : "sin pesaje",
      area: i.modalidades.includes("low_kick") || i.modalidades.includes("k1") ? "Ring" : "Tatami 1",
    }));
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
      .from("inscripcion")
      .select(
        `token, peso_pesaje, clase,
         peleador:peleador_id (nombres, apellidos, club:club_id (nombre)),
         modalidad:modalidad_id (nombre, tipo_area)`
      )
      .eq("evento_id", id)
      .order("id");

    type Fila = {
      token: string;
      peso_pesaje: number | null;
      clase: string | null;
      peleador: { nombres: string; apellidos: string; club: { nombre: string } | null } | null;
      modalidad: { nombre: string; tipo_area: string | null } | null;
    };

    credenciales = ((data ?? []) as unknown as Fila[]).map((f) => ({
      token: f.token,
      nombre: `${f.peleador?.nombres ?? ""} ${f.peleador?.apellidos ?? ""}`.trim(),
      club: f.peleador?.club?.nombre ?? "Sin club",
      categoria: `${f.modalidad?.nombre ?? "—"}${f.clase ? ` · clase ${f.clase}` : ""}`,
      peso: f.peso_pesaje ? `${f.peso_pesaje} kg` : "sin pesaje",
      area: f.modalidad?.tipo_area === "ring" ? "Ring" : "Tatami",
    }));
  }

  const lote = credenciales.slice(desde, desde + cuantos);
  if (lote.length === 0) {
    return NextResponse.json({ error: "no hay credenciales en ese rango" }, { status: 404 });
  }

  const pdf = await generarCredenciales(lote, evento);

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="credenciales-${desde + 1}-${desde + lote.length}.pdf"`,
      "X-Total-Credenciales": String(credenciales.length),
    },
  });
}
