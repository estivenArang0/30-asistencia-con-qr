import { AppError } from "@/lib/http/errores";
import { requerirRol, requerirUsuario } from "@/lib/auth";
import { manejar } from "@/lib/http";
import { obtenerSecretoQr } from "@/lib/http/config";
import { repositorioSesiones } from "@/repositories/sesiones";
import {
  DURACION_INTERVALO_MS,
  TOLERANCIA_INTERVALOS,
  generarToken,
  intervaloDe,
} from "@/services/qr-token";

export const runtime = "nodejs";

interface Contexto {
  params: Promise<{ id: string }>;
}

export const GET = manejar<Contexto>(async (request, { params }) => {
  const usuario = await requerirUsuario(request);
  requerirRol(usuario, "docente");

  const { id } = await params;
  const sesion = await repositorioSesiones().obtener(id);
  // Ajeno o inexistente: 404, para no revelar que la sesión existe.
  if (!sesion || sesion.docenteUid !== usuario.uid) {
    throw new AppError(404, "NO_ENCONTRADA", "La sesión no existe.");
  }

  const ahora = Date.now();
  const token = generarToken(id, obtenerSecretoQr(), ahora);
  // El token vale mientras |intervalo actual − el del token| ≤ tolerancia:
  // generado en `ahora`, deja de ser válido al empezar el intervalo +3.
  const expiraEnMs = (intervaloDe(ahora) + TOLERANCIA_INTERVALOS + 1) * DURACION_INTERVALO_MS;

  return Response.json({ token, expiraEnMs });
});
