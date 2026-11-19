/** Firebase Admin SDK (solo servidor). Nunca se importa desde el navegador. */
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

const VARIABLES_ADMIN = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
] as const;

let aplicacion: App | null = null;

/** Nombres (nunca valores) de las variables de Firebase que faltan. */
export function variablesFaltantes(): string[] {
  return VARIABLES_ADMIN.filter((nombre) => !process.env[nombre]?.trim());
}

/** Hay credenciales de servicio de Firebase (sin cargar el SDK). */
export function adminConfigurado(): boolean {
  return variablesFaltantes().length === 0;
}

/** Quita comillas externas y convierte los \n literales de Vercel en saltos reales. */
function normalizarClave(valor: string): string {
  let clave = valor.trim();
  const comilla = clave[0];
  if ((comilla === '"' || comilla === "'") && clave.at(-1) === comilla) {
    clave = clave.slice(1, -1);
  }
  return clave.replace(/\\n/g, "\n").replace(/\r\n/g, "\n");
}

export function obtenerAdmin(): App {
  const faltan = variablesFaltantes();
  if (faltan.length > 0) {
    throw new Error(`Firebase Admin sin configurar; faltan: ${faltan.join(", ")}`);
  }
  if (aplicacion) return aplicacion;
  if (getApps().length > 0) {
    aplicacion = getApps()[0] ?? null;
    if (aplicacion) return aplicacion;
  }
  const clavePrivada = normalizarClave(process.env.FIREBASE_PRIVATE_KEY ?? "");
  if (!clavePrivada.includes("BEGIN PRIVATE KEY")) {
    throw new Error("FIREBASE_PRIVATE_KEY no contiene una clave PEM válida.");
  }
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
