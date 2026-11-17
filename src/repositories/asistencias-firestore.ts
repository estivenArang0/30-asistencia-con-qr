/** Repositorio de asistencias sobre Firestore: sesiones/{id}/asistencias/{uid}. */
import { getFirestore } from "firebase-admin/firestore";
import { AppError } from "@/lib/errores";
import { obtenerAdmin } from "@/lib/firebase-admin";
import type {
  AsistenciaDeEstudiante,
  AsistenciaListada,
  RegistroAsistencia,
  RepositorioAsistencias,
  SesionAsistencia,
} from "@/repositories/asistencias";
import type { RepositorioSesiones } from "@/repositories/sesiones";

function esAlreadyExists(error: unknown): boolean {
  const codigo = (error as { code?: unknown }).code;
  return codigo === 6 || codigo === "6" || codigo === "already-exists";
}

interface DatosAsistencia {
  uid?: string;
  distanciaM?: number;
  registradaEn?: number;
}

export class RepositorioAsistenciasFirestore implements RepositorioAsistencias {
  private readonly db = getFirestore(obtenerAdmin());

  constructor(private readonly sesiones: RepositorioSesiones) {}

  async obtenerSesion(id: string): Promise<SesionAsistencia | null> {
    return this.sesiones.obtener(id);
  }

  async registrar(
    sesionId: string,
    uid: string,
    registro: RegistroAsistencia,
  ): Promise<void> {
    try {
      await this.db
        .collection("sesiones")
        .doc(sesionId)
        .collection("asistencias")
        .doc(uid)
        .create({ uid, distanciaM: registro.distanciaM, registradaEn: registro.registradaEn });
    } catch (error) {
      if (esAlreadyExists(error)) {
        throw new AppError(409, "DUPLICADO", "Ya registraste tu asistencia en esta sesión.");
      }
      throw error;
    }
  }

  async listar(sesionId: string): Promise<AsistenciaListada[]> {
    const consulta = await this.db
      .collection("sesiones")
      .doc(sesionId)
      .collection("asistencias")
      .get();
    return consulta.docs.map((documento) => {
      const datos = documento.data() as DatosAsistencia;
      return {
        uid: documento.id,
        distanciaM: Number(datos.distanciaM ?? 0),
        registradaEn: Number(datos.registradaEn ?? 0),
      };
    });
  }

  async listarPorUid(uid: string): Promise<AsistenciaDeEstudiante[]> {
    const consulta = await this.db
      .collectionGroup("asistencias")
      .where("uid", "==", uid)
      .get();
    return consulta.docs.map((documento) => {
      const datos = documento.data() as DatosAsistencia;
      return {
        sesionId: documento.ref.parent.parent?.id ?? "",
        distanciaM: Number(datos.distanciaM ?? 0),
        registradaEn: Number(datos.registradaEn ?? 0),
      };
    });
  }
}
