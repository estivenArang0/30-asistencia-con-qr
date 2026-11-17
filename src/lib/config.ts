/** Configuración del servidor. Solo se lee aquí, nunca en los servicios puros. */
import { AppError } from "@/lib/errores";

const LONGITUD_MINIMA_SECRETO = 16;

/** Devuelve QR_SECRET o falla cerrado con un 500 genérico. */
export function obtenerSecretoQr(entorno: NodeJS.ProcessEnv = process.env): string {
  const secreto = entorno.QR_SECRET;
  if (!secreto || secreto.length < LONGITUD_MINIMA_SECRETO) {
    throw new AppError(500, "CONFIG", "El servidor no está configurado correctamente.");
  }
  return secreto;
}

/** Hay credenciales de servicio de Firebase (sin cargar el SDK). */
export function firebaseAdminDisponible(entorno: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(
    entorno.FIREBASE_PROJECT_ID &&
      entorno.FIREBASE_CLIENT_EMAIL &&
      entorno.FIREBASE_PRIVATE_KEY,
  );
}
