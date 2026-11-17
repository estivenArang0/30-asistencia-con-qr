import { requerirRol, requerirUsuario } from "@/lib/auth";
import { manejar } from "@/lib/http";
import { repositorioAsistencias } from "@/repositories/asistencias";
import { repositorioSesiones } from "@/repositories/sesiones";

export const runtime = "nodejs";

/** Historial del estudiante autenticado. El uid sale del token, nunca de la URL. */
export const GET = manejar(async (request) => {
  const usuario = await requerirUsuario(request);
  requerirRol(usuario, "estudiante");

  const registros = await repositorioAsistencias().listarPorUid(usuario.uid);
  const asistencias = await Promise.all(
    registros.map(async (registro) => {
      const sesion = await repositorioSesiones().obtener(registro.sesionId);
      return {
        sesionId: registro.sesionId,
        curso: sesion?.curso ?? "(sesión no disponible)",
        distanciaM: registro.distanciaM,
        registradaEn: registro.registradaEn,
      };
    }),
  );

  return Response.json({ asistencias });
});
