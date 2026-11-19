import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/http/errores";
import { generarToken, verificarToken } from "@/services/qr-token";

const SECRETO = "secreto-de-prueba";
const AHORA = Date.parse("2026-11-16T18:00:00-05:00");

function capturar(fn: () => unknown): AppError {
  try {
    fn();
  } catch (error) {
    if (error instanceof AppError) return error;
    throw error;
  }
  throw new Error("Se esperaba un AppError y no se lanzó ninguno.");
}

describe("token QR firmado", () => {
  it("acepta un token recién generado", () => {
    const token = generarToken("sesion-1", SECRETO, AHORA);
    expect(verificarToken(token, SECRETO, AHORA)).toEqual({ sesionId: "sesion-1" });
  });

  it("rechaza una firma alterada con 401", () => {
    const token = generarToken("sesion-1", SECRETO, AHORA);
    const [sesionId, intervalo, firma] = Buffer.from(token, "base64url")
      .toString("utf8")
      .split(".");
    const alterada = (firma[0] === "a" ? "b" : "a") + firma.slice(1);
    const manipulado = Buffer.from(`${sesionId}.${intervalo}.${alterada}`, "utf8").toString(
      "base64url",
    );

    const error = capturar(() => verificarToken(manipulado, SECRETO, AHORA));
    expect(error.status).toBe(401);
    expect(error.codigo).toBe("FIRMA");
  });

  it("rechaza un token de hace 2 minutos con 410", () => {
    const token = generarToken("sesion-1", SECRETO, AHORA - 120_000);
    const error = capturar(() => verificarToken(token, SECRETO, AHORA));
    expect(error.status).toBe(410);
    expect(error.codigo).toBe("VENCIDO");
  });

  it("acepta el intervalo anterior (−1)", () => {
    const token = generarToken("sesion-1", SECRETO, AHORA - 30_000);
    expect(verificarToken(token, SECRETO, AHORA)).toEqual({ sesionId: "sesion-1" });
  });

  it("acepta un token de hace 60 s (−2 intervalos)", () => {
    const token = generarToken("sesion-1", SECRETO, AHORA - 60_000);
    expect(verificarToken(token, SECRETO, AHORA)).toEqual({ sesionId: "sesion-1" });
  });

  it("acepta un token futuro dentro de la tolerancia (+2 intervalos)", () => {
    const token = generarToken("sesion-1", SECRETO, AHORA + 60_000);
    expect(verificarToken(token, SECRETO, AHORA)).toEqual({ sesionId: "sesion-1" });
  });

  it("rechaza un token de hace 90 s (−3 intervalos) con 410", () => {
    const token = generarToken("sesion-1", SECRETO, AHORA - 90_000);
    const error = capturar(() => verificarToken(token, SECRETO, AHORA));
    expect(error.status).toBe(410);
    expect(error.codigo).toBe("VENCIDO");
  });

  it("rechaza un formato inválido con 400", () => {
    const basura = [
      "",
      "no-es-un-token",
      Buffer.from("solo.dos", "utf8").toString("base64url"),
      Buffer.from("sesion-1.abc.firma", "utf8").toString("base64url"),
    ];
    for (const token of basura) {
      const error = capturar(() => verificarToken(token, SECRETO, AHORA));
      expect(error.status).toBe(400);
      expect(error.codigo).toBe("FORMATO");
    }
  });

  it("rechaza un token firmado con otro secreto con 401", () => {
    const token = generarToken("sesion-1", "otro-secreto", AHORA);
    const error = capturar(() => verificarToken(token, SECRETO, AHORA));
    expect(error.status).toBe(401);
    expect(error.codigo).toBe("FIRMA");
  });
});
