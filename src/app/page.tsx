import type { Metadata } from "next";
import Link from "next/link";
import { TarjetaPelea } from "@/components/ui/tarjeta-pelea";
import { Insignia } from "@/components/ui/badge";
import { estilos } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { NavLanding } from "@/components/nav-landing";
import { FooterLanding } from "@/components/footer-landing";
import { WhatsAppFab } from "@/components/whatsapp-fab";
import { urlWhatsApp } from "@/config/contacto";
import { NOMBRE_MODALIDAD } from "@/types";
import { cn } from "@/utils/cn";

const TITULO = "sass-combate — Torneos de kickboxing, muay thai y MMA sin Excel";
const DESCRIPCION =
  "Software para academias de deportes de contacto: inscripciones, emparejamiento automático, horarios en vivo, pesaje y resultados, incluso sin internet. Para kickboxing, muay thai, boxeo y MMA.";

export const metadata: Metadata = {
  title: { absolute: TITULO },
  description: DESCRIPCION,
  alternates: { canonical: "/" },
  openGraph: {
    title: TITULO,
    description: DESCRIPCION,
    type: "website",
    locale: "es_PE",
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO,
    description: DESCRIPCION,
  },
};

const problemas = [
  ["El Excel del versus", "Emparejar 300 inscritos a mano toma días. El motor propone los cruces por peso, edad, nivel y club en segundos."],
  ["\"¿A qué hora peleo?\"", "Cada peleador recibe un link con su hora estimada, su rival y su área. Se actualiza solo cuando el evento se atrasa."],
  ["Terminar a medianoche", "Los horarios se calculan en cascada. Cuando una pelea se alarga, todo el programa se recorre y sabes el retraso real al minuto."],
  ["El medallero imposible", "Con el catálogo de clubes normalizado, el conteo por academia sale al cierre del evento, listo para publicar."],
];

const pasos = [
  "Los peleadores se inscriben y pasan por pesaje.",
  "El sistema propone los cruces; tú apruebas o cambias.",
  "Se genera el programa con la hora estimada de cada pelea.",
  "La mesa marca ganadores desde una tablet, incluso sin internet.",
  "El público ve todo en vivo desde un link.",
];

const disciplinas = [
  {
    nombre: "Kickboxing",
    detalle: "Las cinco modalidades WAKO, cada una con su propio formato de rounds.",
    chips: ["low_kick", "k1", "kick_light", "light_contact", "point_fighting"] as const,
  },
  { nombre: "Muay Thai", detalle: "Categorías por peso, edad y nivel, igual que kickboxing." },
  { nombre: "Boxeo", detalle: "Emparejamiento por peso y experiencia, actas oficiales en PDF." },
  { nombre: "MMA", detalle: "Llaves de eliminación con avance automático de ganadores." },
] as const;

const planes = [
  {
    nombre: "Gratis",
    icono: "gratis",
    precio: "S/ 0",
    periodo: "",
    resumen: "Para probar la plataforma con tu próximo evento chico.",
    incluye: [
      "1 evento activo",
      "Hasta 40 inscritos",
      "Emparejador y horarios en vivo",
      "Mesa de control offline",
    ],
    destacado: false,
  },
  {
    nombre: "Por evento",
    icono: "evento",
    precio: "S/ 149",
    periodo: "por evento",
    resumen: "Para torneos puntuales, sin compromiso mensual.",
    incluye: [
      "Inscritos ilimitados",
      "Credenciales con QR y acta en PDF",
      "Notificaciones al peleador (email, SMS, WhatsApp, push)",
      "Pago con Yape, Plin, transferencia o tarjeta",
      "Soporte por WhatsApp",
    ],
    destacado: true,
  },
  {
    nombre: "Academia",
    icono: "academia",
    precio: "S/ 299",
    periodo: "por mes (S/ 2,990 al año)",
    resumen: "Para academias y federaciones con eventos seguidos.",
    incluye: [
      "Eventos ilimitados",
      "Multi-club con acceso por coach",
      "Sin marca sass-combate en las páginas públicas",
      "Soporte prioritario",
    ],
    destacado: false,
  },
] as const;

const RUTAS_ICONO: Record<string, string> = {
  gratis: "M5 3l14 9-14 9V3z",
  evento: "M7 3v4M17 3v4M4 9h16M5 6h14a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1z",
  academia: "M4 21h16M6 21V10l6-5 6 5v11M10 21v-6h4v6",
};

function IconoPlan({ tipo }: { tipo: string }) {
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d={RUTAS_ICONO[tipo]} />
      </svg>
    </span>
  );
}

const faqs = [
  {
    p: "¿Necesito internet el día del evento?",
    r: "La mesa de control y el pesaje funcionan sin conexión: cada acción se guarda en el dispositivo y se sincroniza sola cuando vuelve la señal.",
  },
  {
    p: "¿Cómo cobro las inscripciones?",
    r: "Por Yape, Plin, transferencia o efectivo con comprobante (lo revisás vos), o con tarjeta: ahí la pasarela aprueba al instante.",
  },
  {
    p: "¿Puedo tener varios clubes inscribiendo alumnos en mi torneo?",
    r: "Sí. Cada club tiene su propio coach, que solo ve y paga por sus propios alumnos; vos ves el torneo completo.",
  },
  {
    p: "¿Qué pasa si una pelea se atrasa?",
    r: "Las horas nunca se escriben a mano: todo el programa se recalcula solo cuando una pelea termina antes o después de lo previsto.",
  },
  {
    p: "¿Los peleadores necesitan instalar algo?",
    r: "No. Reciben un link personal (o lo escanean por QR) con su hora estimada y su rival, desde cualquier celular.",
  },
  {
    p: "¿Puedo cambiar de plan más adelante?",
    r: "Sí, escríbenos por WhatsApp y lo ajustamos.",
  },
] as const;

export default function Landing() {
  return (
    <>
      <NavLanding />
      <main>
        <section
          id="inicio"
          className="mx-auto grid max-w-5xl scroll-mt-24 gap-10 px-6 pb-20 pt-28 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:pt-32 lg:pb-28"
        >
          <div>
            <p className="animate-fade-in-up text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Para academias de deportes de contacto
            </p>
            <h1
              className="animate-fade-in-up mt-3 font-display text-5xl font-semibold leading-[0.95] tracking-tight sm:text-6xl"
              style={{ animationDelay: "0.13s" }}
            >
              Tu torneo,
              <br />
              sin el Excel
            </h1>
            <p
              className="animate-fade-in-up mt-5 max-w-lg text-lg text-slate-600 dark:text-slate-300"
              style={{ animationDelay: "0.26s" }}
            >
              Inscripciones, emparejamiento, horarios en vivo y resultados. Para
              kickboxing, muay thai, boxeo, MMA y cualquier deporte de combate.
            </p>
            <div className="animate-fade-in-up mt-8 flex flex-wrap gap-3" style={{ animationDelay: "0.39s" }}>
              <Link
                href="/registro"
                className={cn(estilos({ variante: "solido" }), "h-auto px-6 py-3 text-lg transition-all hover:scale-105")}
              >
                Crear mi academia
              </Link>
              <Link
                href="/e/kick1/contender-2026"
                className="rounded-lg border border-borde bg-panel px-6 py-3 font-display text-lg font-semibold transition-colors hover:bg-fondo"
              >
                Ver un evento de ejemplo
              </Link>
            </div>
          </div>

          <div className="animate-fade-in-up relative" style={{ animationDelay: "0.52s" }}>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-8 top-6 -z-10 h-3/4 rounded-full bg-roja/10 blur-3xl dark:bg-roja/20"
            />
            <div className="rounded-2xl border border-borde bg-panel p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                <span>Tatami 1 · pelea 12</span>
                <Insignia estado="en_curso" />
              </div>
              <TarjetaPelea roja="J. Zárate" azul="M. Quispe" tamano="lg" className="mt-4" />
              <p className="mt-1 grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="text-right">La Sexta Calle · 57.0 kg</span>
                <span>Grinta Fight · 56.8 kg</span>
              </p>
              <div className="mt-4 flex items-center justify-between rounded-lg bg-fondo px-3 py-2 text-sm">
                <span className="text-slate-500 dark:text-slate-400">Hora estimada</span>
                <span className="font-display text-lg font-semibold tabular-nums">16:42</span>
              </div>
              <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
                Así lo ve el público, en vivo, sin refrescar.
              </p>
            </div>
          </div>
        </section>

        <div className="h-1 w-full bg-gradient-to-r from-roja to-azul" aria-hidden />

        <section className="border-b border-borde bg-panel">
          <div className="mx-auto grid max-w-4xl gap-8 px-6 py-16 sm:grid-cols-2">
            {problemas.map(([titulo, texto], i) => (
              <Reveal key={titulo} delay={i * 60}>
                <h2 className="font-display text-xl font-semibold">{titulo}</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {texto}
                </p>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="como-funciona" className="mx-auto max-w-3xl scroll-mt-24 px-6 py-16">
          <Reveal as="h2" className="text-center font-display text-3xl font-semibold">
            Cómo funciona el día del evento
          </Reveal>
          <ol className="mx-auto mt-8 grid max-w-xl gap-4">
            {pasos.map((paso, i) => (
              <Reveal key={paso} as="li" delay={i * 80} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 font-display text-base font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
                  {i + 1}
                </span>
                <span className="pt-1 text-slate-700 dark:text-slate-300">{paso}</span>
              </Reveal>
            ))}
          </ol>
        </section>

        <section className="border-y border-borde bg-panel">
          <div className="mx-auto max-w-4xl px-6 py-16">
            <Reveal as="h2" className="text-center font-display text-3xl font-semibold">
              Para cualquier deporte de combate
            </Reveal>
            <div className="mx-auto mt-8 grid gap-4 sm:grid-cols-2">
              {disciplinas.map((d, i) => (
                <Reveal key={d.nombre} delay={i * 60} className="rounded-xl border border-borde bg-fondo p-5">
                  <h3 className="font-display text-lg font-semibold">{d.nombre}</h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{d.detalle}</p>
                  {"chips" in d && (
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {d.chips.map((c) => (
                        <li
                          key={c}
                          className="rounded-md bg-slate-100 px-2 py-0.5 text-xs dark:bg-white/10 dark:text-slate-300"
                        >
                          {NOMBRE_MODALIDAD[c]}
                        </li>
                      ))}
                    </ul>
                  )}
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="precios" className="mx-auto max-w-5xl scroll-mt-24 px-6 py-16">
          <Reveal as="h2" className="text-center font-display text-3xl font-semibold">
            Precios
          </Reveal>
          <Reveal as="p" delay={80} className="mx-auto mt-2 max-w-md text-center text-slate-600 dark:text-slate-300">
            En soles, sin letra chica. Empieza gratis y crece cuando lo necesites.
          </Reveal>
          <div className="mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-3">
            {planes.map((plan, i) => (
              <Reveal
                as="div"
                key={plan.nombre}
                delay={i * 100}
                className={cn(
                  "rounded-2xl border p-6 transition-transform duration-300 hover:-translate-y-1",
                  plan.destacado
                    ? "border-2 border-slate-900 bg-panel shadow-sm dark:border-white"
                    : "border-borde bg-panel"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <IconoPlan tipo={plan.icono} />
                  {plan.destacado && (
                    <span className="mt-1 inline-block rounded-full bg-slate-900 px-3 py-1 font-display text-xs font-semibold uppercase tracking-wide text-white dark:bg-white dark:text-slate-900">
                      Más elegido
                    </span>
                  )}
                </div>
                <h3 className="mt-3 font-display text-xl font-semibold">{plan.nombre}</h3>
                <p className="mt-3">
                  <span className="font-display text-4xl font-semibold tabular-nums">
                    {plan.precio}
                  </span>
                  {plan.periodo && (
                    <span className="ml-1 text-sm text-slate-500 dark:text-slate-400">
                      {plan.periodo}
                    </span>
                  )}
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{plan.resumen}</p>
                <ul className="mt-4 grid gap-2 text-sm">
                  {plan.incluye.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-exito" aria-hidden>
                        ✓
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/registro"
                  className={cn(
                    estilos({ variante: plan.destacado ? "solido" : "contorno", tamano: "md" }),
                    "mt-6 w-full"
                  )}
                >
                  Empezar
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="faq" className="border-t border-borde bg-panel">
          <div className="mx-auto max-w-2xl scroll-mt-24 px-6 py-16">
            <Reveal as="h2" className="text-center font-display text-3xl font-semibold">
              Preguntas frecuentes
            </Reveal>
            <div className="mt-8 grid gap-3">
              {faqs.map((f, i) => (
                <Reveal key={f.p} as="details" delay={i * 40} className="accordion-item group rounded-xl border border-borde bg-fondo p-4">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 font-medium marker:content-none">
                    {f.p}
                    <span
                      className="shrink-0 text-lg text-slate-400 transition-transform group-open:rotate-45 dark:text-slate-500"
                      aria-hidden
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {f.r}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="font-display text-3xl font-semibold">¿Listo para tu próximo torneo?</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Crea tu academia gratis, o escríbenos si tenés dudas antes de empezar.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/registro" className={estilos({ tamano: "lg" })}>
              Crear mi academia
            </Link>
            <a
              href={urlWhatsApp()}
              target="_blank"
              rel="noreferrer"
              className={estilos({ variante: "contorno", tamano: "lg" })}
            >
              Escríbenos por WhatsApp
            </a>
          </div>
        </section>
      </main>
      <FooterLanding />
      <WhatsAppFab />
    </>
  );
}
