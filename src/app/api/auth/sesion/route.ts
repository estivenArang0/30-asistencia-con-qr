import { AppError } from "@/lib/errores";
import { leerJson, manejar } from "@/lib/http";

export const runtime = "nodejs";

const CINCO_DIAS_MS = 5 * 24 * 60 * 60 * 1000;
const MAX_ANTIGUEDAD_LOGIN_S = 5 * 60;

function cookieSesion(valor: string, maxAgeSegundos: number): string {
  const seguro = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `sesion=${valor}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSegundos}${seguro}`;
}

/** POST { idToken } → cookie de sesión HttpOnly (204). */
export const POST = manejar(async (request) => {
  const cuerpo = (await leerJson(request)) as { idToken?: unknown };
  if (typeof cuerpo.idToken !== "string" || !cuerpo.idToken) {
    throw new AppError(400, "TOKEN", "Falta el idToken de Firebase.");
  }

  const { adminConfigurado, authAdmin } = await import("@/lib/firebase-admin");
  if (!adminConfigurado()) {
    throw new AppError(500, "CONFIG", "Firebase Admin no está configurado.");
  }

  let decodificado;
  try {
    // checkRevoked = true: un token revocado no puede crear sesión.
    decodificado = await authAdmin().verifyIdToken(cuerpo.idToken, true);
  } catch {
    throw new AppError(401, "TOKEN", "El idToken no es válido.");
  }

  const ahoraSegundos = Math.floor(Date.now() / 1000);
  const authTime = decodificado.auth_time;
  if (!authTime || ahoraSegundos - authTime > MAX_ANTIGUEDAD_LOGIN_S) {
    throw new AppError(401, "SESION_VIEJA", "Vuelve a iniciar sesión.");
  }

  const cookie = await authAdmin().createSessionCookie(cuerpo.idToken, {
    expiresIn: CINCO_DIAS_MS,
  });

  return new Response(null, {
    status: 204,
    headers: { "Set-Cookie": cookieSesion(cookie, CINCO_DIAS_MS / 1000) },
  });
});

/** DELETE → borra la cookie (204). */
export const DELETE = manejar(async () => {
  return new Response(null, {
    status: 204,
    headers: { "Set-Cookie": cookieSesion("", 0) },
  });
});
