/** Contrato del repositorio de asistencias y selección de implementación. */
import { firebaseAdminDisponible } from "@/lib/http/config";
import { RepositorioAsistenciasFirestore } from "@/repositories/firestore/asistencias";
import { RepositorioAsistenciasEnMemoria } from "@/repositories/memoria/asistencias";
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

/**
 * Selección de repositorio: inyección de pruebas > Firestore (si hay credenciales)
 * > memoria. Los singletons viven en `globalThis` para sobrevivir al hot reload.
 */
type EstadoRepositorios = {
  memoriaAsistencias?: RepositorioAsistenciasEnMemoria;
  firestoreAsistencias?: RepositorioAsistenciasFirestore;
  reemplazoAsistencias?: RepositorioAsistencias;
};

const ambito = globalThis as typeof globalThis & { __qrRepositorios?: EstadoRepositorios };

export function repositorioAsistencias(): RepositorioAsistencias {
  ambito.__qrRepositorios ??= {};
  const estado = ambito.__qrRepositorios;
  if (estado.reemplazoAsistencias) return estado.reemplazoAsistencias;
  if (firebaseAdminDisponible()) {
    estado.firestoreAsistencias ??= new RepositorioAsistenciasFirestore(repositorioSesiones());
    return estado.firestoreAsistencias;
  }
  estado.memoriaAsistencias ??= new RepositorioAsistenciasEnMemoria();
  return estado.memoriaAsistencias;
}

/** Inyección para pruebas: reemplaza el repositorio por una instancia limpia. */
export function reemplazarRepositorioAsistencias(repo: RepositorioAsistencias): void {
  ambito.__qrRepositorios ??= {};
  ambito.__qrRepositorios.reemplazoAsistencias = repo;
}
