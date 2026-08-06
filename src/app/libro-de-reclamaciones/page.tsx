import type { Metadata } from "next";
import { NavLanding } from "@/components/nav-landing";
import { FooterLanding } from "@/components/footer-landing";
import { FormularioReclamo } from "./formulario";

export const metadata: Metadata = {
  title: "Libro de Reclamaciones",
  description:
    "Presenta un reclamo o una queja sobre sass-combate, conforme a la normativa de protección al consumidor del Perú.",
};

export default function PaginaLibroDeReclamaciones() {
  return (
    <>
      <NavLanding />
      <main className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Legal
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold">Libro de Reclamaciones</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Conforme al Código de Protección y Defensa del Consumidor (Ley N.º
          29571), este es el Libro de Reclamaciones Virtual de sass-combate.
          Tienes derecho a formular un reclamo o una queja sobre el servicio
          que ofrece la plataforma. Nuestra respuesta llega al correo que
          indiques abajo, en un plazo no mayor a quince (15) días hábiles,
          improrrogable.
        </p>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Proveedor: sass-combate. RUC: 10708343931. Domicilio: pendiente de
          completar aquí en cuanto esté disponible. Contacto:{" "}
          <a href="mailto:jfhrdeveloper@gmail.com" className="underline">
            jfhrdeveloper@gmail.com
          </a>
          .
        </p>

        <div className="mt-8">
          <FormularioReclamo />
        </div>
      </main>
      <FooterLanding />
    </>
  );
}
