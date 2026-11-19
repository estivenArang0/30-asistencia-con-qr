import { requerirRol, requerirUsuario } from "@/lib/auth";
import { obtenerSecretoQr } from "@/lib/http/config";
import { leerJson, manejar } from "@/lib/http";
import { repositorioAsistencias } from "@/repositories/asistencias";
import { esquemaAsistencia } from "@/schemas/asistencia";
import { registrarAsistencia } from "@/services/asistencia";

export const runtime = "nodejs";

export const POST = manejar(async (request) => {
  const usuario = await requerirUsuario(request);
  requerirRol(usuario, "estudiante");

  const { token, lat, lng } = esquemaAsistencia.parse(await leerJson(request));
  const ahora = Date.now();

  const { distanciaM } = await registrarAsistencia(
    { token, lat, lng, uid: usuario.uid },
    { repo: repositorioAsistencias(), secreto: obtenerSecretoQr(), ahoraMs: ahora },
  );

  return Response.json({ distanciaM, registradaEn: ahora }, { status: 201 });
});
