import { randomUUID } from "node:crypto";
import { requerirRol, requerirUsuario } from "@/lib/auth";
import { leerJson, manejar } from "@/lib/http";
import { repositorioSesiones } from "@/repositories/sesiones";
import { esquemaSesion } from "@/schemas/asistencia";

export const runtime = "nodejs";

export const POST = manejar(async (request) => {
  const usuario = await requerirUsuario(request);
  requerirRol(usuario, "docente");

  const datos = esquemaSesion.parse(await leerJson(request));
  const sesion = await repositorioSesiones().crear({
    id: randomUUID(),
    docenteUid: usuario.uid,
    ...datos,
  });

  return Response.json(sesion, { status: 201 });
});

export const GET = manejar(async (request) => {
  const usuario = await requerirUsuario(request);
  requerirRol(usuario, "docente");

  const sesiones = await repositorioSesiones().listarPorDocente(usuario.uid);
  return Response.json({ sesiones });
});
