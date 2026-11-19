/** Implementación en memoria de asistencias: pruebas y desarrollo. No persiste nada. */
import { AppError } from "@/lib/http/errores";
import type {
  AsistenciaDeEstudiante,
  AsistenciaListada,
  RegistroAsistencia,
  RepositorioAsistencias,
  SesionAsistencia,
} from "@/repositories/asistencias";
import { repositorioSesiones } from "@/repositories/sesiones";

/** Resuelve la sesión desde el repositorio de sesiones (o desde el mapa local en pruebas). */
type ProveedorSesiones = (
  id: string,
) => Promise<SesionAsistencia | null> | SesionAsistencia | null;

const desdeSesiones: ProveedorSesiones = (id) => repositorioSesiones().obtener(id);

export class RepositorioAsistenciasEnMemoria implements RepositorioAsistencias {
  private readonly sesiones: Map<string, SesionAsistencia>;
  private readonly registros = new Map<string, Map<string, RegistroAsistencia>>();
  private readonly proveedor: ProveedorSesiones;

  constructor(
    sesiones: readonly SesionAsistencia[] = [],
    proveedor: ProveedorSesiones = desdeSesiones,
  ) {
    this.sesiones = new Map(sesiones.map((sesion) => [sesion.id, sesion]));
    this.proveedor = proveedor;
  }

  async obtenerSesion(id: string): Promise<SesionAsistencia | null> {
    const local = this.sesiones.get(id);
    if (local) return local;
    return await this.proveedor(id);
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

  async listar(sesionId: string): Promise<AsistenciaListada[]> {
    const deSesion = this.registros.get(sesionId);
    if (!deSesion) return [];
    return [...deSesion.entries()].map(([uid, registro]) => ({ uid, ...registro }));
  }

  async listarPorUid(uid: string): Promise<AsistenciaDeEstudiante[]> {
    const resultado: AsistenciaDeEstudiante[] = [];
    for (const [sesionId, deSesion] of this.registros) {
      const registro = deSesion.get(uid);
      if (registro) resultado.push({ sesionId, ...registro });
    }
    return resultado.sort((a, b) => b.registradaEn - a.registradaEn);
  }

  /** Auxiliar de pruebas: cuántos estudiantes hay registrados en una sesión. */
  contarRegistros(sesionId: string): number {
    return this.registros.get(sesionId)?.size ?? 0;
  }
}
