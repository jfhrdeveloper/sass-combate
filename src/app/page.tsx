import Link from "next/link";

const problemas = [
  ["El Excel del versus", "Emparejar 300 inscritos a mano toma días. El motor propone los cruces por peso, edad, nivel y club en segundos."],
  ["\"¿A qué hora peleo?\"", "Cada peleador recibe un link con su hora estimada, su rival y su área. Se actualiza solo cuando el evento se atrasa."],
  ["Terminar a medianoche", "Los horarios se calculan en cascada. Cuando una pelea se alarga, todo el programa se recorre y sabes el retraso real al minuto."],
  ["El medallero imposible", "Con el catálogo de clubes normalizado, el conteo por academia sale al cierre del evento, listo para publicar."],
];

export default function Landing() {
  return (
    <main>
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Para academias de deportes de contacto
        </p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
          Tu torneo, sin el Excel
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
          Inscripciones, emparejamiento, horarios en vivo y resultados. Para
          kickboxing, muay thai, boxeo, MMA y cualquier deporte de combate.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/registro"
            className="rounded-lg bg-slate-900 px-6 py-3 font-medium text-white hover:bg-slate-700"
          >
            Crear mi academia
          </Link>
          <Link
            href="/e/kick1/contender-2026"
            className="rounded-lg border border-borde bg-white px-6 py-3 font-medium hover:bg-slate-50"
          >
            Ver un evento de ejemplo
          </Link>
        </div>
      </section>

      <section className="border-y border-borde bg-panel">
        <div className="mx-auto grid max-w-4xl gap-8 px-6 py-16 sm:grid-cols-2">
          {problemas.map(([titulo, texto]) => (
            <div key={titulo}>
              <h2 className="font-medium">{titulo}</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="text-center text-2xl font-semibold">Cómo funciona el día del evento</h2>
        <ol className="mx-auto mt-8 grid max-w-xl gap-4">
          {[
            "Los peleadores se inscriben y pasan por pesaje.",
            "El sistema propone los cruces; tú apruebas o cambias.",
            "Se genera el programa con la hora estimada de cada pelea.",
            "La mesa marca ganadores desde una tablet, incluso sin internet.",
            "El público ve todo en vivo desde un link.",
          ].map((paso, i) => (
            <li key={paso} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-medium text-white">
                {i + 1}
              </span>
              <span className="pt-0.5 text-slate-700">{paso}</span>
            </li>
          ))}
        </ol>
      </section>

      <footer className="border-t border-borde">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-sm text-slate-500">
          <span>Plataforma de torneos de combate</span>
          <span className="flex gap-4">
            <Link href="/entrar" className="hover:text-slate-900">
              Entrar
            </Link>
            <Link href="/registro" className="hover:text-slate-900">
              Crear cuenta
            </Link>
          </span>
        </div>
      </footer>
    </main>
  );
}
