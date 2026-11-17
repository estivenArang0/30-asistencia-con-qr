/** Firebase Admin SDK (solo servidor). Nunca se importa desde el navegador. */
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

let aplicacion: App | null = null;

/** Hay credenciales de servicio configuradas. */
export function adminConfigurado(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY,
  );
}

export function obtenerAdmin(): App {
  if (!adminConfigurado()) {
    throw new Error("Firebase Admin no está configurado (faltan FIREBASE_*).");
  }
  if (aplicacion) return aplicacion;
  if (getApps().length > 0) {
    aplicacion = getApps()[0] ?? null;
    if (aplicacion) return aplicacion;
  }
  // En Vercel la clave llega con "\n" literales: se convierten en saltos reales.
  const clavePrivada = (process.env.FIREBASE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
  aplicacion = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: clavePrivada,
    }),
  });
  return aplicacion;
}

export function authAdmin(): Auth {
  return getAuth(obtenerAdmin());
}
