import { AppError } from "@/lib/errores";
import { adminConfigurado, authAdmin, variablesFaltantes } from "@/lib/firebase-admin";
import { leerJson, manejar } from "@/lib/http";

export const runtime = "nodejs";

const CINCO_DIAS_MS = 5 * 24 * 60 * 60 * 1000;
const MAX_ANTIGUEDAD_LOGIN_S = 5 * 60;

function cookieSesion(valor: string, maxAgeSegundos: number): string {
  const seguro = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `sesion=${valor}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSegundos}${seguro}`;
}

/** Registra la causa sin stack, cuerpo, cabeceras, tokens ni variables de entorno. */
function registrarCausa(paso: string, error: unknown): void {
  const nombre = error instanceof Error ? error.name : typeof error;
  const codigo =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";
  const mensaje = String(error instanceof Error ? error.message : error)
    .replace(/\s+/g, " ")
    .slice(0, 200);
  console.error(`[sesion] ${paso}: ${nombre}${codigo ? ` code=${codigo}` : ""} ${mensaje}`);
}

/** POST { idToken } → cookie de sesión HttpOnly (204). */
export const POST = manejar(async (request) => {
  const cuerpo = (await leerJson(request)) as { idToken?: unknown };
  if (typeof cuerpo.idToken !== "string" || !cuerpo.idToken) {
    throw new AppError(400, "TOKEN", "Falta el idToken de Firebase.");
  }

  if (!adminConfigurado()) {
    console.error(
      `[sesion] Firebase Admin sin configurar; faltan: ${variablesFaltantes().join(", ")}`,
    );
    throw new AppError(500, "CONFIG", "Error interno del servidor.");
  }

  let admin: ReturnType<typeof authAdmin>;
  try {
    admin = authAdmin();
  } catch (error) {
    registrarCausa("inicializar Firebase Admin", error);
    throw new AppError(500, "CONFIG", "Error interno del servidor.");
  }

  let decodificado;
  try {
    // checkRevoked = true: un token revocado no puede crear sesión.
    decodificado = await admin.verifyIdToken(cuerpo.idToken, true);
  } catch {
    throw new AppError(401, "TOKEN", "El idToken no es válido.");
  }

  const ahoraSegundos = Math.floor(Date.now() / 1000);
  const authTime = decodificado.auth_time;
  const emitidoEn = decodificado.iat;
  if (
    !authTime ||
    !emitidoEn ||
    ahoraSegundos - authTime > MAX_ANTIGUEDAD_LOGIN_S ||
    ahoraSegundos - emitidoEn > MAX_ANTIGUEDAD_LOGIN_S
  ) {
    throw new AppError(401, "SESION_VIEJA", "Vuelve a iniciar sesión.");
  }

  let cookie: string;
  try {
    cookie = await admin.createSessionCookie(cuerpo.idToken, {
      expiresIn: CINCO_DIAS_MS,
    });
  } catch (error) {
    registrarCausa("crear cookie de sesión", error);
    throw new AppError(500, "SESION", "Error interno del servidor.");
  }

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
