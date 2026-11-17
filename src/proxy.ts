/**
 * `proxy.ts` (antes middleware) NO es la frontera de seguridad: solo mejora la
 * experiencia redirigiendo a /login si falta la cookie. Cada ruta y cada
 * handler vuelven a verificar la sesión y la autorización por objeto.
 *
 * En desarrollo con AUTH_DEV=1 se deja pasar: el login dev no crea cookie.
 */
import { NextResponse, type NextRequest } from "next/server";

export default function proxy(request: NextRequest): NextResponse {
  const desarrollo = process.env.NODE_ENV !== "production" && process.env.AUTH_DEV === "1";
  if (desarrollo) return NextResponse.next();
  if (request.cookies.has("sesion")) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/", "/historial", "/docente/:path*"],
};
