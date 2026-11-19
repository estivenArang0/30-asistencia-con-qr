import { describe, expect, it } from "vitest";
import { estadoSesion, ordenarSesiones } from "@/lib/utils/estado-sesion";

const INICIA = "2026-11-17T10:00:00-05:00";
const TERMINA = "2026-11-17T11:00:00-05:00";

describe("estadoSesion", () => {
  it("es programada antes de iniciar", () => {
    expect(estadoSesion(INICIA, TERMINA, Date.parse(INICIA) - 1)).toBe("programada");
  });

  it("está abierta justo al iniciar", () => {
    expect(estadoSesion(INICIA, TERMINA, Date.parse(INICIA))).toBe("abierta");
  });

  it("sigue abierta justo antes de terminar", () => {
    expect(estadoSesion(INICIA, TERMINA, Date.parse(TERMINA) - 1)).toBe("abierta");
  });

  it("ya terminó justo en el límite de fin", () => {
    expect(estadoSesion(INICIA, TERMINA, Date.parse(TERMINA))).toBe("terminada");
  });

  it("sigue terminada después del fin", () => {
    expect(estadoSesion(INICIA, TERMINA, Date.parse(TERMINA) + 60_000)).toBe("terminada");
  });
});

describe("ordenarSesiones", () => {
  it("pone abiertas, luego programadas y al final terminadas", () => {
    const ahora = Date.parse("2026-11-17T10:30:00-05:00");
    const sesiones = [
      { id: "terminada", inicia: "2026-11-17T09:00:00-05:00", termina: "2026-11-17T10:00:00-05:00" },
      { id: "programada", inicia: "2026-11-17T12:00:00-05:00", termina: "2026-11-17T13:00:00-05:00" },
      { id: "abierta", inicia: "2026-11-17T10:00:00-05:00", termina: "2026-11-17T11:00:00-05:00" },
    ];

    expect(ordenarSesiones(sesiones, ahora).map((sesion) => sesion.id)).toEqual([
      "abierta",
      "programada",
      "terminada",
    ]);
  });
});
