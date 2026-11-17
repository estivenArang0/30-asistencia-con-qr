/** Autenticación de peticiones: token Bearer + roles. */
import { AppError } from "@/lib/errores";

export type Rol = "docente" | "estudiante";

export interface Usuario {
  uid: string;
  correo: string;
  rol: Rol;
}

export type VerificadorToken = (token: string) => Promise<Usuario | null>;

/**
 * Verificador de desarrollo: acepta `dev.<uid>.<rol>` SOLO con `AUTH_DEV=1`
 * y fuera de producción. En cualquier otro caso rechaza todo (falla cerrado).
 *
 * TODO: sustituir por Firebase Admin (`auth.verifyIdToken` para Bearer o
 * `auth.verifySessionCookie` si se migra a cookies) cuando se conecte Auth.
 * Ese verificador debe devolver `{ uid, correo, rol }` leyendo el rol de los
 * custom claims, nunca del cuerpo de la petición.
 */
export const verificadorDev: VerificadorToken = async (token) => {
  if (process.env.AUTH_DEV !== "1" || process.env.NODE_ENV === "production") return null;
  const partes = token.split(".");
  if (partes.length !== 3 || partes[0] !== "dev") return null;
  const [, uid, rol] = partes;
  if (!uid) return null;
  if (rol !== "docente" && rol !== "estudiante") return null;
  return { uid, correo: `${uid}@dev.local`, rol };
};

/** Extrae y valida el Bearer. Lanza 401 si falta o no es válido. */
export async function requerirUsuario(
  request: Request,
  verificador: VerificadorToken = verificadorDev,
): Promise<Usuario> {
  const cabecera = request.headers.get("authorization") ?? "";
  const [esquema, token] = cabecera.split(" ");
  if (esquema?.toLowerCase() !== "bearer" || !token) {
    throw new AppError(401, "NO_AUTENTICADO", "Falta el token de sesión.");
  }
  const usuario = await verificador(token);
  if (!usuario) {
    throw new AppError(401, "NO_AUTENTICADO", "El token de sesión no es válido.");
  }
  return usuario;
}

/** Comprueba el rol; error 403 si no coincide. */
export function requerirRol(usuario: Usuario, rol: Rol): void {
  if (usuario.rol !== rol) {
    throw new AppError(403, "SIN_PERMISO", "No tienes permiso para esta acción.");
  }
}
