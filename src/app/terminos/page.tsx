import type { Metadata } from "next";
import Link from "next/link";
import { NavLanding } from "@/components/nav-landing";
import { FooterLanding } from "@/components/footer-landing";

export const metadata: Metadata = {
  title: "Términos y condiciones — sass-combate",
  description: "Términos y condiciones de uso de la plataforma sass-combate.",
};

export default function PaginaTerminos() {
  return (
    <>
      <NavLanding />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Legal
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold">Términos y condiciones</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Última actualización: 28 de julio de 2026.
        </p>

        <div className="mt-8 grid gap-8 text-slate-700 dark:text-slate-300">
          <section>
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
              1. Qué es sass-combate
            </h2>
            <p className="mt-2 leading-relaxed">
              sass-combate es una plataforma que ayuda a academias y organizadores
              de deportes de contacto (kickboxing, muay thai, boxeo, MMA y
              disciplinas afines) a gestionar inscripciones, emparejamiento,
              pesaje, horarios en vivo, resultados, credenciales y cobros de un
              evento. Al crear una cuenta o usar cualquier parte de la
              plataforma aceptas estos términos.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
              2. Cuentas y academias
            </h2>
            <p className="mt-2 leading-relaxed">
              Cada academia es un espacio independiente (&ldquo;organización&rdquo;) con su
              propio dueño, equipo y eventos. Quien crea la academia es
              responsable de la información que registra, de invitar
              correctamente a su equipo (roles de administrador, mesa de
              control, coach, juez o lector) y de mantener segura su cuenta.
            </p>
            <p className="mt-2 leading-relaxed">
              El registro de atletas (nombre, documento y récord de peleas) se
              comparte entre academias a propósito, para que un peleador con
              historial no pueda inscribirse como debutante en otra academia.
              El detalle de cada evento (categorías, horarios, pagos) sigue
              siendo privado de la academia que lo organiza.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
              3. Peleadores menores de edad
            </h2>
            <p className="mt-2 leading-relaxed">
              Buena parte de los deportistas inscritos en un torneo de combate
              amateur son menores de edad. Quien carga la lista de un club
              (normalmente el coach) declara contar con la autorización de la
              madre, el padre o el tutor legal del menor para registrar sus
              datos e inscribirlo a competir. sass-combate no verifica esa
              autorización de forma independiente: es responsabilidad de la
              academia y del coach que inscribe.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
              4. Uso aceptable
            </h2>
            <ul className="mt-2 grid gap-1.5 list-disc pl-5 leading-relaxed">
              <li>No usar la plataforma para inscribir datos falsos que afecten la seguridad de un peleador (peso, edad o récord adulterados).</li>
              <li>No intentar acceder a datos de otra academia, evento o usuario más allá de lo que la plataforma expone públicamente (por ejemplo, la vista pública de un evento o el link personal de un peleador).</li>
              <li>No sobrecargar, automatizar contra, ni intentar vulnerar la plataforma o su infraestructura.</li>
              <li>No usar los canales de notificación (email, SMS, WhatsApp, push) para enviar contenido que no sea información del propio evento.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
              5. Pagos de inscripciones a un evento
            </h2>
            <p className="mt-2 leading-relaxed">
              Las inscripciones se pueden pagar por Yape, Plin, transferencia,
              efectivo (con comprobante revisado por la propia academia) o
              tarjeta, procesada por Culqi. sass-combate no es la pasarela de
              pago ni retiene fondos: cuando pagas con tarjeta, el cargo lo
              procesa y confirma Culqi; cuando pagas por Yape, Plin o
              transferencia, el comprobante lo revisa y aprueba la academia
              organizadora. Las políticas de reembolso de la inscripción a un
              evento las define cada academia organizadora, no la plataforma.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
              6. Pago de los planes de sass-combate y devoluciones
            </h2>
            <p className="mt-2 leading-relaxed">
              A diferencia de las inscripciones (punto 5), los planes{" "}
              <strong>Por evento</strong> y <strong>Academia</strong> (ver{" "}
              <Link href="/#precios" className="underline">
                precios
              </Link>
              ) sí los cobra directamente sass-combate, con tarjeta a través
              de Culqi, desde dentro de la plataforma una vez que ya creaste
              tu cuenta. Son cobros únicos por el período contratado (el
              evento, o el mes o año de Academia): no se renuevan solos, así
              que si no vuelves a pagar, tu academia sigue existiendo pero
              vuelve al plan Gratis al vencer el período.
            </p>
            <p className="mt-2 leading-relaxed">
              <strong>Derecho de retracto:</strong> conforme al Código de
              Protección y Defensa del Consumidor, tienes 7 días calendario
              desde la compra para solicitar la devolución completa de un
              plan, siempre que todavía no lo hayas usado de forma sustancial
              (por ejemplo, si ya corriste un evento completo con el plan Por
              evento, se considera consumido). Pasado ese plazo, o si el
              servicio ya se usó, el pago de ese período no es reembolsable,
              pero puedes cancelar la renovación en cualquier momento desde tu
              cuenta o escribiéndonos. Para pedir un retracto, escríbenos a{" "}
              <a href="mailto:jfhrdeveloper@gmail.com" className="underline">
                jfhrdeveloper@gmail.com
              </a>{" "}
              indicando el pago y la fecha.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
              7. Disponibilidad del servicio
            </h2>
            <p className="mt-2 leading-relaxed">
              La mesa de control y el pesaje están diseñados para seguir
              funcionando sin conexión a internet, guardando la información en
              el dispositivo hasta que vuelva la señal. Aun así, no garantizamos
              disponibilidad ininterrumpida de la plataforma ni de sus
              integraciones externas (pagos, notificaciones, hospedaje).
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
              8. Limitación de responsabilidad
            </h2>
            <p className="mt-2 leading-relaxed">
              sass-combate se ofrece &ldquo;tal cual&rdquo;. En la máxima medida permitida
              por ley, no somos responsables por decisiones deportivas,
              disputas entre academias o peleadores, ni por pérdidas derivadas
              del uso de la plataforma, incluyendo interrupciones del servicio
              el día de un evento.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
              9. Cambios a estos términos
            </h2>
            <p className="mt-2 leading-relaxed">
              Podemos actualizar estos términos cuando cambie el producto.
              Si el cambio es importante, lo vamos a anunciar dentro de la
              plataforma antes de que entre en vigor.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
              10. Ley aplicable y contacto
            </h2>
            <p className="mt-2 leading-relaxed">
              Estos términos se rigen por las leyes de la República del Perú.
              Para consultas sobre estos términos, o para presentar un
              reclamo o queja, escríbenos a{" "}
              <a href="mailto:jfhrdeveloper@gmail.com" className="underline">
                jfhrdeveloper@gmail.com
              </a>{" "}
              o por WhatsApp al{" "}
              <a href="https://wa.me/51931314659" className="underline">
                +51 931 314 659
              </a>
              , o completa el{" "}
              <Link href="/libro-de-reclamaciones" className="underline">
                Libro de Reclamaciones
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
      <FooterLanding />
    </>
  );
}
