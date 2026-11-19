import { describe, expect, it } from "vitest";
import { mensajePrecision, PRECISION_MAXIMA_M } from "@/lib/utils/precision";

const AVISO =
  "Ubicación poco precisa; usa un dispositivo con GPS o corrige las coordenadas a mano";

describe("mensajePrecision", () => {
  it("no avisa con 100 m o mejor", () => {
    expect(PRECISION_MAXIMA_M).toBe(100);
    expect(mensajePrecision(0)).toBeNull();
    expect(mensajePrecision(100)).toBeNull();
  });

  it("avisa cuando la precisión es peor que 100 m", () => {
    expect(mensajePrecision(100.1)).toBe(AVISO);
    expect(mensajePrecision(3275)).toBe(AVISO);
  });

  it("no avisa sin medición", () => {
    expect(mensajePrecision(null)).toBeNull();
  });
});
