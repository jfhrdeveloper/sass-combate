import { describe, expect, it } from "vitest";
import { aplicarDescuento } from "@/lib/descuentos";

describe("aplicarDescuento", () => {
  it("sin descuento devuelve el total intacto", () => {
    expect(aplicarDescuento(150, null)).toBe(150);
  });

  it("resta un monto fijo en soles", () => {
    expect(aplicarDescuento(150, { tipo: "monto", valor: 20 })).toBe(130);
  });

  it("aplica un porcentaje sobre el total", () => {
    expect(aplicarDescuento(200, { tipo: "porcentaje", valor: 10 })).toBe(180);
  });

  it("nunca baja de 0, aunque el descuento supere el total", () => {
    expect(aplicarDescuento(50, { tipo: "monto", valor: 200 })).toBe(0);
  });

  it("un 100% de descuento deja el total en 0", () => {
    expect(aplicarDescuento(300, { tipo: "porcentaje", valor: 100 })).toBe(0);
  });

  it("redondea a centavos", () => {
    expect(aplicarDescuento(100, { tipo: "porcentaje", valor: 33.33 })).toBe(66.67);
  });
});
