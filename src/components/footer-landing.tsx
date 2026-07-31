import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, WifiOff, Ban } from "lucide-react";
import { EMAIL_SOPORTE, urlWhatsApp } from "@/lib/contacto";
import { WhatsAppIcon } from "@/components/whatsapp-icon";

const CONFIANZA = [
  { texto: "Datos aislados por academia", icono: ShieldCheck },
  { texto: "La mesa de control funciona sin internet", icono: WifiOff },
  { texto: "Cobro por período, sin permanencia", icono: Ban },
] as const;

const COLUMNAS = [
  {
    titulo: "Producto",
    enlaces: [
      ["Cómo funciona", "/#como-funciona"],
      ["Precios", "/#precios"],
      ["FAQ", "/#faq"],
      ["Evento de ejemplo", "/e/kick1/contender-2026"],
    ],
  },
  {
    titulo: "Cuenta",
    enlaces: [
      ["Entrar", "/entrar"],
      ["Crear cuenta", "/registro"],
    ],
  },
] as const;

const ENLACES_LEGAL = [
  ["Términos y condiciones", "/terminos"],
  ["Política de privacidad", "/privacidad"],
  ["Libro de Reclamaciones", "/libro-de-reclamaciones"],
] as const;

export function FooterLanding() {
  return (
    <footer id="contacto" className="scroll-mt-24 border-t border-borde">
      <div className="mx-auto grid max-w-5xl gap-8 px-6 py-12 sm:grid-cols-[1.1fr_0.8fr_0.7fr_1.4fr]">
        <div>
          <p className="font-display text-lg font-semibold tracking-tight">sass-combate</p>
          <p className="mt-2 max-w-xs text-sm text-slate-500 dark:text-slate-400">
            Inscripciones, emparejamiento, horarios en vivo y resultados para
            torneos de deportes de contacto.
          </p>
          <ul className="mt-4 grid gap-1.5 text-sm text-slate-600 dark:text-slate-300">
            <li>
              <a href={`mailto:${EMAIL_SOPORTE}`} className="link-underline hover:text-slate-900 dark:hover:text-white">
                {EMAIL_SOPORTE}
              </a>
            </li>
            <li>
              <a
                href={urlWhatsApp()}
                target="_blank"
                rel="noreferrer"
                className="link-underline inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white"
              >
                <WhatsAppIcon size={15} className="shrink-0" /> +51 931 314 659
              </a>
            </li>
          </ul>

          <ul className="mt-5 grid gap-2 text-xs text-slate-500 dark:text-slate-400">
            {CONFIANZA.map(({ texto, icono: Icono }) => (
              <li key={texto} className="flex items-start gap-2">
                <Icono size={14} className="mt-0.5 shrink-0 text-exito" />
                {texto}
              </li>
            ))}
          </ul>
        </div>

        {COLUMNAS.map((col) => (
          <div key={col.titulo}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {col.titulo}
            </p>
            <ul className="mt-3 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
              {col.enlaces.map(([texto, href]) => (
                <li key={href}>
                  <Link href={href} className="link-underline hover:text-slate-900 dark:hover:text-white">
                    {texto}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Legal
          </p>
          <div className="mt-3 flex items-start gap-3">
            <Link
              href="/libro-de-reclamaciones"
              aria-label="Libro de Reclamaciones"
              className="inline-block shrink-0 transition-opacity hover:opacity-80"
            >
              <Image
                src="/libro-reclamaciones.png"
                alt="Libro de Reclamaciones"
                width={568}
                height={439}
                className="h-20 w-auto"
              />
            </Link>
            <ul className="grid gap-2 text-sm text-slate-600 dark:text-slate-300">
              {ENLACES_LEGAL.map(([texto, href]) => (
                <li key={href}>
                  <Link href={href} className="link-underline hover:text-slate-900 dark:hover:text-white">
                    {texto}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-borde">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4 text-xs text-slate-400 dark:text-slate-500">
          <span>© {new Date().getFullYear()} sass-combate. Todos los derechos reservados.</span>
          <span>Hecho para academias de kickboxing, muay thai, boxeo y MMA.</span>
        </div>
      </div>
    </footer>
  );
}
