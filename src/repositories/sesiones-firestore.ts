/** Repositorio de sesiones sobre Firestore (Admin SDK, solo servidor). */
import { getFirestore } from "firebase-admin/firestore";
import { AppError } from "@/lib/errores";
import { obtenerAdmin } from "@/lib/firebase-admin";
import type { RepositorioSesiones, Sesion } from "@/repositories/sesiones";

const COLECCION = "sesiones";

/** Firestore devuelve code 6 (ALREADY_EXISTS) si el documento ya existe. */
function esAlreadyExists(error: unknown): boolean {
  const codigo = (error as { code?: unknown }).code;
  return codigo === 6 || codigo === "6" || codigo === "already-exists";
}

export class RepositorioSesionesFirestore implements RepositorioSesiones {
  private readonly db = getFirestore(obtenerAdmin());

  async crear(sesion: Sesion): Promise<Sesion> {
    try {
      await this.db.collection(COLECCION).doc(sesion.id).create(sesion);
      return sesion;
    } catch (error) {
      if (esAlreadyExists(error)) {
        throw new AppError(409, "DUPLICADO", "La sesión ya existe.");
      }
      throw error;
    }
  }

  async obtener(id: string): Promise<Sesion | null> {
    const documento = await this.db.collection(COLECCION).doc(id).get();
    return documento.exists ? (documento.data() as Sesion) : null;
  }

  async listarPorDocente(uid: string): Promise<Sesion[]> {
    const consulta = await this.db.collection(COLECCION).where("docenteUid", "==", uid).get();
    return consulta.docs.map((documento) => documento.data() as Sesion);
  }
}
