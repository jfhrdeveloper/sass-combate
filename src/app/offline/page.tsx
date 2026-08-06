export const metadata = { title: "Sin conexión" };

export default function PaginaSinConexion() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center p-6 text-center">
      <h1 className="text-2xl font-semibold">Sin conexión</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Esta pantalla todavía no estaba guardada en el dispositivo. Las pantallas
        que ya abriste hoy siguen funcionando.
      </p>
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
        Lo que registres mientras tanto se guarda aquí y se envía solo cuando
        vuelva la señal.
      </p>
    </main>
  );
}
