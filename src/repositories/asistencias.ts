/** Contrato del repositorio de asistencias + implementación en memoria. */
import { AppError } from "@/lib/errores";
import { repositorioSesiones } from "@/repositories/sesiones";

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

export interface AsistenciaListada extends RegistroAsistencia {
  uid: string;
}

export interface AsistenciaDeEstudiante extends RegistroAsistencia {
  sesionId: string;
}

export interface RepositorioAsistencias {
  obtenerSesion(id: string): Promise<SesionAsistencia | null>;
  registrar(sesionId: string, uid: string, registro: RegistroAsistencia): Promise<void>;
  listar(sesionId: string): Promise<AsistenciaListada[]>;
  listarPorUid(uid: string): Promise<AsistenciaDeEstudiante[]>;
}

/** Resuelve la sesión desde el repositorio de sesiones (o desde el mapa local en pruebas). */
type ProveedorSesiones = (
  id: string,
) => Promise<SesionAsistencia | null> | SesionAsistencia | null;

const desdeSesiones: ProveedorSesiones = (id) => repositorioSesiones().obtener(id);

/** Implementación en memoria: pruebas y desarrollo. No persiste nada. */
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

/**
 * Singleton en `globalThis`: sobrevive al hot reload de Next en desarrollo.
 * El proveedor por defecto consulta el repositorio de sesiones vigente.
 */
type EstadoRepositorios = { reposAsistencias?: RepositorioAsistenciasEnMemoria };

const ambito = globalThis as typeof globalThis & { __qrRepositorios?: EstadoRepositorios };

export function repositorioAsistencias(): RepositorioAsistenciasEnMemoria {
  ambito.__qrRepositorios ??= {};
  ambito.__qrRepositorios.reposAsistencias ??= new RepositorioAsistenciasEnMemoria();
  return ambito.__qrRepositorios.reposAsistencias;
}

/** Inyección para pruebas: reemplaza el singleton por una instancia limpia. */
export function reemplazarRepositorioAsistencias(repo: RepositorioAsistenciasEnMemoria): void {
  ambito.__qrRepositorios ??= {};
  ambito.__qrRepositorios.reposAsistencias = repo;
}
