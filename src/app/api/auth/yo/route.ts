import { requerirUsuario } from "@/lib/auth";
import { manejar } from "@/lib/http";

export const runtime = "nodejs";

export const GET = manejar(async (request) => {
  const usuario = await requerirUsuario(request);
  return Response.json({ usuario });
});
