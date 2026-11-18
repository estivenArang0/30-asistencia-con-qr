/** Caso de uso: registrar la asistencia de un estudiante a una sesión. */
import { AppError } from "@/lib/errores";
import type { RepositorioAsistencias } from "@/repositories/asistencias";
import { dentroDelRadio, haversine } from "@/services/distancia";
import { verificarToken } from "@/services/qr-token";

export interface DatosAsistencia {
  token: string;
  lat: number;
  lng: number;
  uid: string;
  /** Opcional: si la ruta lo envía, debe coincidir con el `sesionId` del token. */
  sesionId?: string;
}

export interface DependenciasAsistencia {
  repo: RepositorioAsistencias;
  secreto: string;
  ahoraMs: number;
}

export interface ResultadoAsistencia {
  distanciaM: number;
}

export async function registrarAsistencia(
  datos: DatosAsistencia,
  deps: DependenciasAsistencia,
): Promise<ResultadoAsistencia> {
  const { token, lat, lng, uid, sesionId: sesionSolicitada } = datos;
  const { repo, secreto, ahoraMs } = deps;

  if (!uid) throw new AppError(400, "UID", "Falta el identificador del estudiante.");

  const { sesionId } = verificarToken(token, secreto, ahoraMs);

  // El `sesionId` válido es el que va firmado dentro del token. Si la ruta
  // también recibe un id, se exige que coincida (400) para que nadie pueda
  // consultar una sesión distinta a la del QR presentado.
  if (sesionSolicitada !== undefined && sesionSolicitada !== sesionId) {
    throw new AppError(
      400,
      "SESION_NO_COINCIDE",
      "La sesión del código QR no coincide con la sesión solicitada.",
    );
  }

  const sesion = await repo.obtenerSesion(sesionId);
  if (!sesion) {
    throw new AppError(404, "NO_ENCONTRADA", "La sesión de asistencia no existe.");
  }

  if (ahoraMs < Date.parse(sesion.inicia) || ahoraMs > Date.parse(sesion.termina)) {
    throw new AppError(409, "SESION_CERRADA", "La sesión de asistencia no está abierta.");
  }

  const distanciaM = haversine(lat, lng, sesion.lat, sesion.lng);
  if (!dentroDelRadio(distanciaM, sesion.radioM)) {
    throw new AppError(
      422,
      "FUERA_DE_RADIO",
      `Estás a ${Math.round(distanciaM)} m del aula y el radio permitido es ${Math.round(sesion.radioM)} m. Tus coordenadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}.`,
    );
  }

  await repo.registrar(sesionId, uid, { distanciaM, registradaEn: ahoraMs });
  return { distanciaM };
}
