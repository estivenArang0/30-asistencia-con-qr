import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const raiz = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.join(raiz, "src"),
    },
  },
  server: {
    fs: {
      // El workspace espejo (30-asistencia-con-qr-ia) comparte src/ y tests/
      // por junction: las rutas se resuelven al proyecto real y hay que permitirlo.
      allow: [raiz, path.resolve(raiz, "..", "30-asistencia-con-qr")],
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [path.join(raiz, "tests", "setup.ts")],
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    restoreMocks: true,
  },
});
