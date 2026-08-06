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
  const esProtegida = PROTEGIDAS.some((p) => ruta.startsWith(p));
  const esSoloAnonimo = SOLO_ANONIMO.some((p) => ruta.startsWith(p));

  /**
   * `getUser()` valida el token contra el servidor de Auth de Supabase: es
   * una llamada de red real, no un chequeo local. Sin Supabase configurado
   * el proyecto corre en modo demo y no hay sesión que validar; y aunque
   * haya Supabase, no hace falta resolver sesión en rutas que no la usan
   * (la agenda pública `/e/[org]/[evento]`, `/p/[token]`, la landing...).
   * Esas son justo las que reciben más tráfico en un evento en vivo (cientos
   * de espectadores anónimos mirando el mismo evento desde el celular), así
   * que evitar la llamada ahí es lo que más importa.
   */
  if (url && key && (esProtegida || esSoloAnonimo)) {
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

    if (!user && esProtegida) {
      const destino = new URL("/entrar", req.url);
      destino.searchParams.set("volver", ruta);
      return NextResponse.redirect(destino);
    }

    if (user && esSoloAnonimo) {
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

    if (sub && !RESERVADOS.has(sub) && !yaEsPublica && !esProtegida && !esSoloAnonimo) {
      return NextResponse.rewrite(new URL(`/e/${sub}${ruta}`, req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|webp)$).*)"],
};
