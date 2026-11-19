import { describe, expect, it } from "vitest";
import { destinoSeguro } from "@/lib/utils/redireccion";

describe("destinoSeguro", () => {
  it("acepta rutas internas", () => {
    expect(destinoSeguro("/asistir/abc")).toBe("/asistir/abc");
    expect(destinoSeguro("/docente/sesiones/1?x=1")).toBe("/docente/sesiones/1?x=1");
  });

  it("cae en / para valores ausentes o peligrosos", () => {
    expect(destinoSeguro(null)).toBe("/");
    expect(destinoSeguro("")).toBe("/");
    expect(destinoSeguro("//evil.com")).toBe("/");
    expect(destinoSeguro("https://evil.com")).toBe("/");
    expect(destinoSeguro("javascript:alert(1)")).toBe("/");
    expect(destinoSeguro("/\\evil.com")).toBe("/");
  });
});
