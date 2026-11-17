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
};

export default nextConfig;
