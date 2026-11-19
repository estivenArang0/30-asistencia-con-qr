/** Implementación en memoria de sesiones: pruebas y desarrollo. No persiste nada. */
import type { RepositorioSesiones, Sesion } from "@/repositories/sesiones";

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
