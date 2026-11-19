import { AppError } from "@/lib/http/errores";
import { requerirRol, requerirUsuario } from "@/lib/auth";
import { aCsv } from "@/lib/utils/csv";
import { manejar } from "@/lib/http";
import { repositorioAsistencias } from "@/repositories/asistencias";
import { repositorioSesiones } from "@/repositories/sesiones";

export const runtime = "nodejs";

interface Contexto {
  params: Promise<{ id: string }>;
}

/** RF-06: exporta los asistentes de una sesión a CSV (solo el docente dueño). */
export const GET = manejar<Contexto>(async (request, { params }) => {
  const usuario = await requerirUsuario(request);
  requerirRol(usuario, "docente");

  const { id } = await params;
  const sesion = await repositorioSesiones().obtener(id);
  if (!sesion || sesion.docenteUid !== usuario.uid) {
    throw new AppError(404, "NO_ENCONTRADA", "La sesión no existe.");
  }

  const asistentes = await repositorioAsistencias().listar(id);
  const filas: string[][] = [["uid", "distanciaM", "registradaEn"]];
  for (const asistente of asistentes) {
    filas.push([
      asistente.uid,
      String(Math.round(asistente.distanciaM)),
      new Date(asistente.registradaEn).toISOString(),
    ]);
  }

  return new Response(aCsv(filas), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="asistentes-${id}.csv"`,
    },
  });
});
