import { describe, expect, it } from "vitest";
import { urlMapa } from "@/lib/mapa";

describe("urlMapa", () => {
  it("arma el enlace exacto de Google Maps", () => {
    expect(urlMapa(6.2, -75.5)).toBe("https://www.google.com/maps?q=6.2,-75.5");
  });

  it("conserva los signos negativos de latitud y longitud", () => {
    expect(urlMapa(-33.4489, -70.6693)).toBe(
      "https://www.google.com/maps?q=-33.4489,-70.6693",
    );
  });
});
