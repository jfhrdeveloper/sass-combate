import { exigirAcademia } from "@/lib/auth";
import { Tarjeta, TarjetaDato, TarjetaTitulo } from "@/components/ui/card";
import { fechaLarga } from "@/lib/format";
import { SelectorPlan } from "./selector-plan";

export default async function PaginaPlan() {
  const { academia, sesion } = await exigirAcademia();
  const vencido = academia.plan_vence_en ? new Date(academia.plan_vence_en) < new Date() : false;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Plan</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        El plan Academia cubre todos tus eventos mientras esté vigente. Un
        plan cubre un período: no se renueva solo, antes de que venza vuelve
        a pagar aquí para seguir en ese plan.
      </p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        ¿Solo necesitas destrabar el tope de 40 inscritos de un evento
        puntual, sin pagar la academia completa? Eso se compra desde ese
        evento — entra a él y buscá &ldquo;Desbloquear evento&rdquo;.
      </p>

      <Tarjeta className="mt-6">
        <TarjetaTitulo>Plan actual</TarjetaTitulo>
        <TarjetaDato className="capitalize">{academia.plan}</TarjetaDato>
        {academia.plan_vence_en && (
          <p className={`mt-1 text-sm ${vencido ? "text-roja" : "text-slate-500 dark:text-slate-400"}`}>
            {vencido ? "Venció el" : "Vence el"} {fechaLarga(academia.plan_vence_en)}
          </p>
        )}
      </Tarjeta>

      <h2 className="mt-8 text-lg font-medium">Comprar o renovar</h2>
      <div className="mt-3">
        <SelectorPlan email={sesion.email} />
      </div>
    </main>
  );
}
