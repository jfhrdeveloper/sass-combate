import { envPublico, envServidor } from "@/config/env";

export const CULQI_CONFIGURADO = Boolean(
  envServidor.CULQI_SECRET_KEY && envPublico.NEXT_PUBLIC_CULQI_PUBLIC_KEY
);

export interface CargoCulqi {
  id: string;
  outcome: { type: string; user_message: string };
}

/**
 * Crea el cargo en Culqi a partir del token que generó Checkout.js en el
 * navegador. El monto va en céntimos (S/ 50.00 -> 5000), como exige su API.
 * Sin SDK: es una sola llamada REST, no justifica una dependencia nueva.
 */
export async function crearCargoCulqi(params: {
  tokenId: string;
  montoSoles: number;
  email: string;
  descripcion: string;
}): Promise<CargoCulqi> {
  const res = await fetch("https://api.culqi.com/v2/charges", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${envServidor.CULQI_SECRET_KEY}`,
    },
    body: JSON.stringify({
      amount: Math.round(params.montoSoles * 100),
      currency_code: "PEN",
      email: params.email,
      source_id: params.tokenId,
      description: params.descripcion,
    }),
  });

  const data = await res.json();
  if (!res.ok || data.object === "error") {
    throw new Error(data.user_message || data.merchant_message || "El banco rechazó la tarjeta");
  }
  return data as CargoCulqi;
}
