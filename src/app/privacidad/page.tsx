import type { Metadata } from "next";
import { NavLanding } from "@/components/nav-landing";
import { FooterLanding } from "@/components/footer-landing";

export const metadata: Metadata = {
  title: "Política de privacidad — sass-combate",
  description: "Qué datos recopila sass-combate, para qué los usa y con quién los comparte.",
};

export default function PaginaPrivacidad() {
  return (
    <>
      <NavLanding />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Legal
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold">Política de privacidad</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Última actualización: 28 de julio de 2026.
        </p>

        <div className="mt-8 grid gap-8 text-slate-700 dark:text-slate-300">
          <section>
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
              1. Qué datos recopilamos
            </h2>
            <ul className="mt-2 grid gap-1.5 list-disc pl-5 leading-relaxed">
              <li><strong>De quien crea la cuenta:</strong> nombre, correo y, si entras con Google, tu foto y nombre de perfil.</li>
              <li><strong>De cada peleador:</strong> nombres, apellidos, documento de identidad, fecha de nacimiento, sexo, club, peso declarado y de pesaje, y opcionalmente teléfono y correo (solo si se cargan para poder avisarle cuando su pelea se acerque).</li>
              <li><strong>De pagos:</strong> método, monto, número de operación y, si pagaste por Yape/Plin/transferencia, la imagen del comprobante. Si pagaste con tarjeta, el número de tarjeta lo recibe directamente Culqi: nunca pasa por nuestros servidores.</li>
              <li><strong>Técnicos:</strong> cookies de sesión (para mantenerte conectado) y, si activas los avisos push, una suscripción de notificaciones del navegador.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
              2. Peleadores menores de edad
            </h2>
            <p className="mt-2 leading-relaxed">
              Los datos de un peleador menor de edad los ingresa su coach o
              academia, no el menor directamente. Si eres madre, padre o tutor y
              quieres revisar, corregir o pedir la eliminación de los datos de
              un menor a tu cargo, puedes escribirnos (ver el punto 6) o pedirle
              a la academia que lo inscribió que lo gestione.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
              3. Para qué usamos estos datos
            </h2>
            <ul className="mt-2 grid gap-1.5 list-disc pl-5 leading-relaxed">
              <li>Organizar el evento: inscripciones, pesaje, emparejamiento, horarios, resultados y actas.</li>
              <li>Reconocer a un peleador que ya compitió antes (por su documento) para calcular su nivel deportivo, aunque cambie de academia — por eso ese registro se comparte entre academias.</li>
              <li>Avisarte por email, SMS, WhatsApp o notificación push cuando tu pelea esté por empezar, solo si diste ese dato de contacto o activaste el aviso.</li>
              <li>Generar tu credencial con QR y el acta oficial del evento.</li>
              <li>Revisar y aprobar comprobantes de pago.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
              4. Con quién se comparte
            </h2>
            <p className="mt-2 leading-relaxed">
              No vendemos datos a terceros. Los compartimos únicamente con los
              proveedores que hacen funcionar la plataforma, cada uno solo con
              lo que necesita para su función:
            </p>
            <ul className="mt-2 grid gap-1.5 list-disc pl-5 leading-relaxed">
              <li><strong>Supabase:</strong> base de datos, autenticación y almacenamiento de comprobantes.</li>
              <li><strong>Vercel:</strong> hospedaje de la aplicación.</li>
              <li><strong>Culqi:</strong> procesamiento del pago con tarjeta.</li>
              <li><strong>Resend:</strong> envío de los correos de aviso.</li>
              <li><strong>Twilio:</strong> envío de SMS y WhatsApp de aviso.</li>
            </ul>
            <p className="mt-2 leading-relaxed">
              Dentro de la plataforma, el detalle de un evento (pagos,
              resultados internos) solo lo ve la academia organizadora; el
              resumen deportivo de un atleta (récord de peleas) es visible para
              cualquier academia, por diseño, para evitar que alguien con
              experiencia se inscriba como debutante.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
              5. Cuánto tiempo conservamos los datos
            </h2>
            <p className="mt-2 leading-relaxed">
              Conservamos los datos de un evento mientras la academia mantenga
              su cuenta activa. Si una academia cierra su cuenta, sus eventos y
              pagos dejan de estar disponibles; el resumen deportivo compartido
              del atleta (nombre, documento y récord) puede conservarse para que
              otras academias sigan reconociendo su historial.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
              6. Tus derechos
            </h2>
            <p className="mt-2 leading-relaxed">
              De acuerdo con la Ley N.º 29733 (Ley de Protección de Datos
              Personales del Perú), puedes pedir acceder, rectificar, cancelar
              u oponerte al uso de tus datos (derechos ARCO). Para ejercerlos,
              escríbenos a{" "}
              <a href="mailto:jfhrdeveloper@gmail.com" className="underline">
                jfhrdeveloper@gmail.com
              </a>{" "}
              indicando qué dato quieres revisar y a qué academia o evento
              corresponde.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
              7. Seguridad
            </h2>
            <p className="mt-2 leading-relaxed">
              El acceso a los datos de cada academia está restringido por
              políticas de seguridad a nivel de base de datos (RLS): ninguna
              academia puede leer los eventos, pagos o inscripciones de otra.
              La comunicación entre tu navegador y nuestros servidores va
              cifrada (HTTPS).
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
              8. Cambios a esta política
            </h2>
            <p className="mt-2 leading-relaxed">
              Si cambiamos esta política de forma importante, lo vamos a
              anunciar dentro de la plataforma antes de que entre en vigor.
            </p>
          </section>
        </div>
      </main>
      <FooterLanding />
    </>
  );
}
