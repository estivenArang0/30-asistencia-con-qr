import { AppError } from "@/lib/errores";
import { requerirRol, requerirUsuario } from "@/lib/auth";
import { manejar } from "@/lib/http";
import { repositorioAsistencias } from "@/repositories/asistencias";
import { repositorioSesiones } from "@/repositories/sesiones";

export const runtime = "nodejs";

interface Contexto {
  params: Promise<{ id: string }>;
}

export const GET = manejar<Contexto>(async (request, { params }) => {
  const usuario = await requerirUsuario(request);
  // El rol se comprueba antes: un estudiante recibe 403, no 404.
  requerirRol(usuario, "docente");

  const { id } = await params;
  const sesion = await repositorioSesiones().obtener(id);
  if (!sesion || sesion.docenteUid !== usuario.uid) {
    throw new AppError(404, "NO_ENCONTRADA", "La sesión no existe.");
  }

  const asistentes = await repositorioAsistencias().listar(id);
  return Response.json({ asistentes });
});
