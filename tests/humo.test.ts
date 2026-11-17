import { describe, expect, it } from "vitest";
import { z } from "zod";

// Prueba mínima de base: comprueba que Vitest, Zod y el entorno jsdom funcionan.
const esquemaSesion = z
  .object({
    curso: z.string().min(1),
    radioM: z.number().positive(),
  })
  .strict();

describe("base del proyecto", () => {
  it("valida datos correctos con Zod", () => {
    const datos = esquemaSesion.parse({ curso: "Cálculo I", radioM: 50 });
    expect(datos.curso).toBe("Cálculo I");
  });

  it("rechaza datos inválidos con Zod", () => {
    expect(() => esquemaSesion.parse({ curso: "", radioM: -1 })).toThrow();
  });

  it("ejecuta las pruebas en un entorno de DOM", () => {
    expect(typeof document).toBe("object");
  });
});
