/** Sesiones de asistencia: contrato e implementación en memoria. */
import type { SesionAsistencia } from "@/repositories/asistencias";
import { firebaseAdminDisponible } from "@/lib/config";
import { RepositorioSesionesFirestore } from "@/repositories/sesiones-firestore";

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
 * Selección de repositorio: inyección de pruebas > Firestore (si hay credenciales)
 * > memoria. Los singletons viven en `globalThis` para sobrevivir al hot reload.
 */
type EstadoRepositorios = {
  memoriaSesiones?: RepositorioSesionesEnMemoria;
  firestoreSesiones?: RepositorioSesionesFirestore;
  reemplazoSesiones?: RepositorioSesiones;
};

const ambito = globalThis as typeof globalThis & { __qrRepositorios?: EstadoRepositorios };

export function repositorioSesiones(): RepositorioSesiones {
  ambito.__qrRepositorios ??= {};
  const estado = ambito.__qrRepositorios;
  if (estado.reemplazoSesiones) return estado.reemplazoSesiones;
  if (firebaseAdminDisponible()) {
    estado.firestoreSesiones ??= new RepositorioSesionesFirestore();
    return estado.firestoreSesiones;
  }
  estado.memoriaSesiones ??= new RepositorioSesionesEnMemoria();
  return estado.memoriaSesiones;
}

/** Inyección para pruebas: reemplaza el repositorio por una instancia limpia. */
export function reemplazarRepositorioSesiones(repo: RepositorioSesiones): void {
  ambito.__qrRepositorios ??= {};
  ambito.__qrRepositorios.reemplazoSesiones = repo;
}

/** Vista mínima que consumen los servicios de asistencia. */
export type { SesionAsistencia };
