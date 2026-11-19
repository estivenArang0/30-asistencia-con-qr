import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/http/errores";
import type { SesionAsistencia } from "@/repositories/asistencias";
import { RepositorioAsistenciasEnMemoria } from "@/repositories/memoria/asistencias";
import { registrarAsistencia } from "@/services/asistencia";
import { generarToken } from "@/services/qr-token";

const SECRETO = "secreto-de-prueba";
const AHORA = Date.parse("2026-11-16T18:00:00-05:00");

const SESION: SesionAsistencia = {
  id: "sesion-1",
  curso: "Cálculo I",
  lat: 0,
  lng: 0,
  radioM: 100,
  inicia: new Date(AHORA - 600_000).toISOString(),
  termina: new Date(AHORA + 600_000).toISOString(),
};

function crearRepo(): RepositorioAsistenciasEnMemoria {
  return new RepositorioAsistenciasEnMemoria([SESION]);
}

const DENTRO = { lat: 0.0002, lng: 0 }; // ≈ 22 m del aula
const FUERA = { lat: 0.0045, lng: 0 }; // ≈ 500 m del aula

async function capturar(promesa: Promise<unknown>): Promise<AppError> {
  try {
    await promesa;
  } catch (error) {
    if (error instanceof AppError) return error;
    throw error;
  }
  throw new Error("Se esperaba un AppError y no se lanzó ninguno.");
}

describe("registrarAsistencia", () => {
  it("criterio 1: un QR de hace 2 minutos da 410 y no registra", async () => {
    const repo = crearRepo();
    const token = generarToken(SESION.id, SECRETO, AHORA - 120_000);

    const error = await capturar(
      registrarAsistencia({ token, ...DENTRO, uid: "u-1" }, { repo, secreto: SECRETO, ahoraMs: AHORA }),
    );

    expect(error.status).toBe(410);
    expect(error.codigo).toBe("VENCIDO");
    expect(repo.contarRegistros(SESION.id)).toBe(0);
  });

  it("criterio 2: a ≈ 500 m con radio de 100 m da 422 y no registra", async () => {
    const repo = crearRepo();
    const token = generarToken(SESION.id, SECRETO, AHORA);

    const error = await capturar(
      registrarAsistencia({ token, ...FUERA, uid: "u-1" }, { repo, secreto: SECRETO, ahoraMs: AHORA }),
    );

    expect(error.status).toBe(422);
    expect(error.codigo).toBe("FUERA_DE_RADIO");
    expect(error.message).toContain("100 m");
    expect(error.message).toContain("500 m");
    expect(error.message).toContain("Tus coordenadas: 0.004500, 0.000000");
    expect(repo.contarRegistros(SESION.id)).toBe(0);
  });

  it("tras un 422 por distancia, el mismo uid puede registrarse dentro del radio", async () => {
    const repo = crearRepo();
    const token = generarToken(SESION.id, SECRETO, AHORA);
    const deps = { repo, secreto: SECRETO, ahoraMs: AHORA };

    const fuera = await capturar(
      registrarAsistencia({ token, ...FUERA, uid: "u-1" }, deps),
    );
    expect(fuera.status).toBe(422);

    const dentro = await registrarAsistencia({ token, ...DENTRO, uid: "u-1" }, deps);
    expect(dentro.distanciaM).toBeLessThan(SESION.radioM);
    expect(repo.contarRegistros(SESION.id)).toBe(1);
  });

  it("rechaza con 400 un sesionId explícito que no coincide con el del token", async () => {
    const repo = crearRepo();
    const token = generarToken(SESION.id, SECRETO, AHORA);

    const error = await capturar(
      registrarAsistencia(
        { token, ...DENTRO, uid: "u-1", sesionId: "sesion-otra" },
        { repo, secreto: SECRETO, ahoraMs: AHORA },
      ),
    );

    expect(error.status).toBe(400);
    expect(error.codigo).toBe("SESION_NO_COINCIDE");
    expect(repo.contarRegistros(SESION.id)).toBe(0);
  });

  it("criterio 3: el segundo registro del mismo uid da 409 y queda uno solo", async () => {
    const repo = crearRepo();
    const token = generarToken(SESION.id, SECRETO, AHORA);
    const deps = { repo, secreto: SECRETO, ahoraMs: AHORA };

    const primero = await registrarAsistencia({ token, ...DENTRO, uid: "u-1" }, deps);
    expect(primero.distanciaM).toBeGreaterThan(0);
    expect(primero.distanciaM).toBeLessThan(100);

    const error = await capturar(
      registrarAsistencia({ token, ...DENTRO, uid: "u-1" }, deps),
    );
    expect(error.status).toBe(409);
    expect(error.codigo).toBe("DUPLICADO");
    expect(repo.contarRegistros(SESION.id)).toBe(1);
  });

  it("fuera de la ventana de la sesión da 409 SESION_CERRADA", async () => {
    const repo = crearRepo();
    const despues = Date.parse(SESION.termina) + 30_000;
    const token = generarToken(SESION.id, SECRETO, despues);

    const error = await capturar(
      registrarAsistencia(
        { token, ...DENTRO, uid: "u-1" },
        { repo, secreto: SECRETO, ahoraMs: despues },
      ),
    );

    expect(error.status).toBe(409);
    expect(error.codigo).toBe("SESION_CERRADA");
    expect(repo.contarRegistros(SESION.id)).toBe(0);
  });
});
