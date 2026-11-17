import { describe, expect, it, vi } from "vitest";
import { manejar } from "@/lib/http";

describe("manejar", () => {
  it("traduce un AppError aunque la clase venga de otro chunk del bundler", async () => {
    const error = {
      name: "AppError",
      esAppError: true,
      status: 401,
      message: "Falta el token.",
    };
    const handler = manejar(async () => {
      throw error;
    });

    const respuesta = await handler(new Request("http://localhost/x"), undefined);

    expect(respuesta.status).toBe(401);
    expect(((await respuesta.json()) as { error: string }).error).toBe("Falta el token.");
  });

  it("no traduce objetos sin la marca de AppError", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = manejar(async () => {
      throw { status: 401, message: "no es un AppError" };
    });

    const respuesta = await handler(new Request("http://localhost/x"), undefined);

    expect(respuesta.status).toBe(500);
    expect(((await respuesta.json()) as { error: string }).error).toBe(
      "Error interno del servidor.",
    );
  });
});
