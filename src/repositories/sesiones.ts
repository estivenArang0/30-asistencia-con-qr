/** Contrato del repositorio de sesiones y selección de implementación. */
import { firebaseAdminDisponible } from "@/lib/http/config";
import type { SesionAsistencia } from "@/repositories/asistencias";
import { RepositorioSesionesFirestore } from "@/repositories/firestore/sesiones";
import { RepositorioSesionesEnMemoria } from "@/repositories/memoria/sesiones";

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
