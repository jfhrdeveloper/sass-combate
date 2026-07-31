import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { envPublico } from "@/config/env";

const RESERVADOS = new Set([
  "www", "app", "api", "admin", "docs", "blog", "mail", "staging", "soporte",
]);

const PROTEGIDAS = ["/app", "/mesa", "/nueva-academia"];
const SOLO_ANONIMO = ["/entrar", "/registro"];

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const url = envPublico.NEXT_PUBLIC_SUPABASE_URL;
  const key = envPublico.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const ruta = req.nextUrl.pathname;

  // Sin Supabase configurado el proyecto corre en modo demo y no hay sesion que validar.
  if (url && key) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (lista: { name: string; value: string; options: CookieOptions }[]) => {
          lista.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          lista.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && PROTEGIDAS.some((p) => ruta.startsWith(p))) {
      const destino = new URL("/entrar", req.url);
      destino.searchParams.set("volver", ruta);
      return NextResponse.redirect(destino);
    }

    if (user && SOLO_ANONIMO.some((p) => ruta.startsWith(p))) {
      return NextResponse.redirect(new URL("/app", req.url));
    }
  }

  /**
   * Traduce el subdominio de la academia a una ruta interna:
   * academia.midominio.com -> /e/academia
   *
   * Solo resuelve QUE organizacion se esta mirando. La autorizacion real vive
   * en las politicas RLS de Postgres, nunca en el host.
   */
  const host = req.headers.get("host") ?? "";
  const raiz = envPublico.NEXT_PUBLIC_DOMINIO_RAIZ;

  if (host.endsWith(raiz) && host !== raiz) {
    const sub = host.slice(0, host.length - raiz.length - 1);
    const yaEsPublica = ruta.startsWith("/e/") || ruta.startsWith("/p/");
    const esApp =
      PROTEGIDAS.some((p) => ruta.startsWith(p)) || SOLO_ANONIMO.some((p) => ruta.startsWith(p));

    if (sub && !RESERVADOS.has(sub) && !yaEsPublica && !esApp) {
      return NextResponse.rewrite(new URL(`/e/${sub}${ruta}`, req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|webp)$).*)"],
};
