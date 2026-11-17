/**
 * Asigna el custom claim `rol` a los usuarios de prueba.
 * Uso (una vez): node scripts/asignar-roles.mjs
 * Lee las credenciales de .env.local; nunca imprime la clave.
 */
import fs from "node:fs";
import path from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const raiz = process.cwd();
const entorno = fs.readFileSync(path.join(raiz, ".env.local"), "utf8");
const valor = (nombre) => {
  const linea = entorno.split(/\r?\n/).find((l) => l.startsWith(nombre + "="));
  if (!linea) return "";
  return linea.slice(nombre.length + 1).replace(/^"|"$/g, "").replace(/\\n/g, "\n").trim();
};

const projectId = valor("FIREBASE_PROJECT_ID");
const clientEmail = valor("FIREBASE_CLIENT_EMAIL");
const privateKey = valor("FIREBASE_PRIVATE_KEY");

if (!projectId || !clientEmail || !privateKey) {
  console.error("Faltan FIREBASE_* en .env.local");
  process.exit(1);
}

const app = getApps().length > 0 ? getApps()[0] : initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const auth = getAuth(app);

const asignaciones = [
  ["docente@prueba.com", "docente"],
  ["estudiante@prueba.com", "estudiante"],
];

for (const [correo, rol] of asignaciones) {
  const usuario = await auth.getUserByEmail(correo);
  await auth.setCustomUserClaims(usuario.uid, { rol });
  console.log(`${correo} → rol=${rol} (uid ${usuario.uid.slice(0, 6)}…)`);
}

console.log("Listo. Los usuarios deben iniciar sesión de nuevo para refrescar el claim.");
