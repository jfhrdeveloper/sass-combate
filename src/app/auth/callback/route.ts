import { NextResponse, type NextRequest } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  const volver = searchParams.get("volver") ?? "/app";

  if (code) {
    const supabase = await crearClienteServidor();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${volver.startsWith("/") ? volver : "/app"}`);
    }
  }

  return NextResponse.redirect(`${origin}/entrar?error=callback`);
}
