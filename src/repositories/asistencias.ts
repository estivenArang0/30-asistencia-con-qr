/** Contrato del repositorio de asistencias + implementación en memoria. */
import { AppError } from "@/lib/errores";

export interface SesionAsistencia {
  id: string;
  curso: string;
  lat: number;
  lng: number;
  radioM: number;
  inicia: string;
  termina: string;
}

export interface RegistroAsistencia {
  distanciaM: number;
  registradaEn: number;
}

export interface RepositorioAsistencias {
  obtenerSesion(id: string): Promise<SesionAsistencia | null>;
  registrar(sesionId: string, uid: string, registro: RegistroAsistencia): Promise<void>;
}

/** Implementación en memoria: pruebas y desarrollo. No persiste nada. */
export class RepositorioAsistenciasEnMemoria implements RepositorioAsistencias {
  private readonly sesiones = new Map<string, SesionAsistencia>();
  private readonly registros = new Map<string, Map<string, RegistroAsistencia>>();

  constructor(sesiones: readonly SesionAsistencia[] = []) {
    for (const sesion of sesiones) this.sesiones.set(sesion.id, sesion);
  }

  async obtenerSesion(id: string): Promise<SesionAsistencia | null> {
    return this.sesiones.get(id) ?? null;
  }

  async registrar(
    sesionId: string,
    uid: string,
    registro: RegistroAsistencia,
  ): Promise<void> {
    const deSesion = this.registros.get(sesionId) ?? new Map<string, RegistroAsistencia>();
    if (deSesion.has(uid)) {
      throw new AppError(409, "DUPLICADO", "Ya registraste tu asistencia en esta sesión.");
    }
    deSesion.set(uid, registro);
    this.registros.set(sesionId, deSesion);
  }

  /** Auxiliar de pruebas: cuántos estudiantes hay registrados en una sesión. */
  contarRegistros(sesionId: string): number {
    return this.registros.get(sesionId)?.size ?? 0;
  }
}
