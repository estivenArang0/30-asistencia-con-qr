/**
 * Autenticación de peticiones.
 * - Cookie de sesión `sesion` verificada con Firebase Admin (verifySessionCookie).
 * - `Authorization: Bearer <idToken>` verificado con verifyIdToken (Bruno/Postman).
 * - Verificador dev `dev.<uid>.<rol>` SOLO con AUTH_DEV=1 y fuera de producción.
 * El rol sale siempre de los custom claims, nunca del cuerpo ni de la URL.
 */
import { AppError } from "@/lib/errores";

export type Rol = "docente" | "estudiante";

export interface Usuario {
  uid: string;
  correo: string;
  rol: Rol;
}

export type VerificadorToken = (token: string) => Promise<Usuario | null>;

export const NOMBRE_COOKIE = "sesion";

function esRol(valor: unknown): valor is Rol {
  return valor === "docente" || valor === "estudiante";
}

export const verificadorDev: VerificadorToken = async (token) => {
  if (process.env.AUTH_DEV !== "1" || process.env.NODE_ENV === "production") return null;
  const partes = token.split(".");
  if (partes.length !== 3 || partes[0] !== "dev") return null;
  const [, uid, rol] = partes;
  if (!uid || !esRol(rol)) return null;
  return { uid, correo: `${uid}@dev.local`, rol };
};

function leerCookie(request: Request, nombre: string): string | null {
  const cabecera = request.headers.get("cookie");
  if (!cabecera) return null;
  for (const trozo of cabecera.split(";")) {
    const [clave, ...resto] = trozo.trim().split("=");
    if (clave === nombre) return decodeURIComponent(resto.join("="));
  }
  return null;
}

async function usuarioDesdeIdToken(token: string): Promise<Usuario | null> {
  try {
    const { adminConfigurado, authAdmin } = await import("@/lib/firebase-admin");
    if (!adminConfigurado()) return null;
    const decodificado = await authAdmin().verifyIdToken(token, true);
    const rol = decodificado.rol;
    if (!esRol(rol)) return null;
    return { uid: decodificado.uid, correo: decodificado.email ?? "", rol };
  } catch {
    return null;
  }
}

async function usuarioDesdeCookieSesion(cookie: string): Promise<Usuario | null> {
  try {
    const { adminConfigurado, authAdmin } = await import("@/lib/firebase-admin");
    if (!adminConfigurado()) return null;
    const decodificado = await authAdmin().verifySessionCookie(cookie, true);
    const rol = decodificado.rol;
    if (!esRol(rol)) return null;
    return { uid: decodificado.uid, correo: decodificado.email ?? "", rol };
  } catch {
    return null;
  }
}

export async function requerirUsuario(
  request: Request,
  verificador: VerificadorToken = verificadorDev,
): Promise<Usuario> {
  const cookie = leerCookie(request, NOMBRE_COOKIE);
  if (cookie) {
    const porCookie = await usuarioDesdeCookieSesion(cookie);
    if (porCookie) return porCookie;
  }

  const cabecera = request.headers.get("authorization") ?? "";
  const [esquema, token] = cabecera.split(" ");
  if (esquema?.toLowerCase() !== "bearer" || !token) {
    throw new AppError(401, "NO_AUTENTICADO", "Falta el token de sesión.");
  }

  if (token.startsWith("dev.")) {
    const dev = await verificador(token);
    if (dev) return dev;
  }
  const real = await usuarioDesdeIdToken(token);
  if (!real) {
    throw new AppError(401, "NO_AUTENTICADO", "El token de sesión no es válido.");
  }
  return real;
}

export function requerirRol(usuario: Usuario, rol: Rol): void {
  if (usuario.rol !== rol) {
    throw new AppError(403, "SIN_PERMISO", "No tienes permiso para esta acción.");
  }
}
