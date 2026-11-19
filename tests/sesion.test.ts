import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  adminConfigurado: vi.fn(),
  authAdmin: vi.fn(),
  variablesFaltantes: vi.fn(),
}));

vi.mock("@/lib/firebase/admin", () => mocks);

import { GET as getYo } from "@/app/api/auth/yo/route";
import { POST as postSesion } from "@/app/api/auth/sesion/route";

const verifyIdToken = vi.fn();
const createSessionCookie = vi.fn();

function peticionSesion(cuerpo: unknown = {}): Request {
  return new Request("http://localhost/api/auth/sesion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
}

function logsDe(spy: { mock: { calls: unknown[][] } }): string {
  return spy.mock.calls.flat().join(" ");
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.variablesFaltantes.mockReturnValue([]);
  mocks.adminConfigurado.mockReturnValue(true);
  mocks.authAdmin.mockReturnValue({ verifyIdToken, createSessionCookie });
  const ahora = Math.floor(Date.now() / 1000);
  verifyIdToken.mockResolvedValue({
    uid: "uid-1",
    email: "docente@prueba.com",
    rol: "docente",
    auth_time: ahora,
    iat: ahora,
  });
  createSessionCookie.mockResolvedValue("cookie-de-prueba");
});

describe("POST /api/auth/sesion", () => {
  it("devuelve 204 y una cookie HttpOnly, SameSite=Lax y Path=/ con un idToken válido", async () => {
    const respuesta = await postSesion(peticionSesion({ idToken: "id-token-valido" }), undefined);

    expect(respuesta.status).toBe(204);
    const cookie = respuesta.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("sesion=cookie-de-prueba");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("Max-Age=432000");
    expect(verifyIdToken).toHaveBeenCalledWith("id-token-valido", true);
    expect(createSessionCookie).toHaveBeenCalledWith("id-token-valido", {
      expiresIn: 5 * 24 * 60 * 60 * 1000,
    });
  });

  it("devuelve 400 si falta el idToken o no es una cadena", async () => {
    const sinToken = await postSesion(peticionSesion({}), undefined);
    expect(sinToken.status).toBe(400);

    const tokenInvalido = await postSesion(peticionSesion({ idToken: 123 }), undefined);
    expect(tokenInvalido.status).toBe(400);
  });

  it("devuelve 401 si el idToken no se puede verificar", async () => {
    verifyIdToken.mockRejectedValue(new Error("token inválido"));
    const respuesta = await postSesion(peticionSesion({ idToken: "caducado" }), undefined);

    expect(respuesta.status).toBe(401);
    expect(((await respuesta.json()) as { error: string }).error).toContain("idToken");
  });

  it("devuelve 401 si el inicio de sesión es más antiguo que 5 minutos", async () => {
    const viejo = Math.floor(Date.now() / 1000) - 6 * 60;
    verifyIdToken.mockResolvedValue({ uid: "uid-1", auth_time: viejo, iat: viejo });
    const respuesta = await postSesion(peticionSesion({ idToken: "viejo" }), undefined);

    expect(respuesta.status).toBe(401);
  });

  it("devuelve 500 genérico y registra los nombres que faltan si no hay variables", async () => {
    mocks.adminConfigurado.mockReturnValue(false);
    mocks.variablesFaltantes.mockReturnValue([
      "FIREBASE_PROJECT_ID",
      "FIREBASE_PRIVATE_KEY",
    ]);
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const respuesta = await postSesion(peticionSesion({ idToken: "id-token-valido" }), undefined);

    expect(respuesta.status).toBe(500);
    expect(((await respuesta.json()) as { error: string }).error).toBe(
      "Error interno del servidor.",
    );
    expect(logsDe(spy)).toContain("FIREBASE_PROJECT_ID");
    expect(logsDe(spy)).not.toContain("id-token-valido");
  });

  it("devuelve 500 genérico y registra el código si createSessionCookie falla", async () => {
    createSessionCookie.mockRejectedValue(
      Object.assign(new Error("fallo interno"), { code: "auth/internal-error" }),
    );
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const respuesta = await postSesion(peticionSesion({ idToken: "id-token-valido" }), undefined);

    expect(respuesta.status).toBe(500);
    expect(((await respuesta.json()) as { error: string }).error).toBe(
      "Error interno del servidor.",
    );
    expect(logsDe(spy)).toContain("auth/internal-error");
    expect(logsDe(spy)).not.toContain("id-token-valido");
  });
});

describe("GET /api/auth/yo", () => {
  it("devuelve 401 sin cookie de sesión", async () => {
    const respuesta = await getYo(new Request("http://localhost/api/auth/yo"), undefined);

    expect(respuesta.status).toBe(401);
    expect(((await respuesta.json()) as { error: string }).error).toContain("token");
  });
});
