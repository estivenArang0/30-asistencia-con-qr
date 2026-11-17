import { describe, expect, it } from "vitest";
import { dentroDelRadio, haversine } from "@/services/distancia";

const TOLERANCIA_RELATIVA = 0.005; // 0,5 %

describe("distancia (haversine)", () => {
  it("un grado de latitud en el ecuador mide ≈ 111 195 m", () => {
    const distancia = haversine(0, 0, 1, 0);
    expect(Math.abs(distancia - 111_195) / 111_195).toBeLessThan(TOLERANCIA_RELATIVA);
  });

  it("el mismo punto da 0 m", () => {
    expect(haversine(6.2442, -75.5812, 6.2442, -75.5812)).toBe(0);
  });

  it("0,0045° de latitud son ≈ 500 m y quedan fuera de un radio de 100 m", () => {
    const distancia = haversine(0, 0, 0.0045, 0);
    expect(distancia).toBeGreaterThan(495);
    expect(distancia).toBeLessThan(505);
    expect(dentroDelRadio(distancia, 100)).toBe(false);
    expect(dentroDelRadio(distancia, 600)).toBe(true);
  });
});
