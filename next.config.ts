import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita que Turbopack escanee fuera de la carpeta del proyecto
  // (hay un package-lock.json en el directorio del usuario).
  turbopack: {
    root: path.resolve("."),
  },
  // Desactivado: `cacheComponents` no admite `export const runtime = "nodejs"`
  // en los Route Handlers, y la especificación exige runtime Node explícito.
  cacheComponents: false,
  // firebase-admin viene externalizado por defecto; al empaquetarlo se evita
  // el require() del alias externo que falla con ERR_REQUIRE_ESM en Vercel.
  transpilePackages: ["firebase-admin"],
};

export default nextConfig;
