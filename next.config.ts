import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita que Turbopack escanee fuera de la carpeta del proyecto
  // (hay un package-lock.json en el directorio del usuario).
  turbopack: {
    root: path.resolve("."),
  },
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
