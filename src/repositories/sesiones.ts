/** Sesiones de asistencia: contrato e implementación en memoria. */
import type { SesionAsistencia } from "@/repositories/asistencias";

export interface Sesion {
  id: string;
  docenteUid: string;
  curso: string;
  lat: number;
  lng: number;
  radioM: number;
  inicia: string;
  termina: string;
}

export interface RepositorioSesiones {
  crear(sesion: Sesion): Promise<Sesion>;
  obtener(id: string): Promise<Sesion | null>;
  listarPorDocente(uid: string): Promise<Sesion[]>;
}

/** Implementación en memoria: pruebas y desarrollo. No persiste nada. */
export class RepositorioSesionesEnMemoria implements RepositorioSesiones {
  private readonly sesiones = new Map<string, Sesion>();

  async crear(sesion: Sesion): Promise<Sesion> {
    this.sesiones.set(sesion.id, sesion);
    return sesion;
  }

  async obtener(id: string): Promise<Sesion | null> {
    return this.sesiones.get(id) ?? null;
  }

  async listarPorDocente(uid: string): Promise<Sesion[]> {
    return [...this.sesiones.values()].filter((sesion) => sesion.docenteUid === uid);
  }
}

/**
 * Singleton en `globalThis`: Next recompila los módulos en caliente y sin esto
 * cada recarga borraría las sesiones creadas en desarrollo.
 */
type EstadoRepositorios = { reposSesiones?: RepositorioSesionesEnMemoria };

const ambito = globalThis as typeof globalThis & { __qrRepositorios?: EstadoRepositorios };

export function repositorioSesiones(): RepositorioSesionesEnMemoria {
  ambito.__qrRepositorios ??= {};
  ambito.__qrRepositorios.reposSesiones ??= new RepositorioSesionesEnMemoria();
  return ambito.__qrRepositorios.reposSesiones;
}

/** Inyección para pruebas: reemplaza el singleton por una instancia limpia. */
export function reemplazarRepositorioSesiones(repo: RepositorioSesionesEnMemoria): void {
  ambito.__qrRepositorios ??= {};
  ambito.__qrRepositorios.reposSesiones = repo;
}

/** Vista mínima que consumen los servicios de asistencia. */
export type { SesionAsistencia };
