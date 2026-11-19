"use client";

/** Cliente Firebase: SOLO autenticación. El navegador nunca importa firestore. */
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

export function firebaseWebConfigurado(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_APP_ID);
}

export function authCliente(): Auth {
  const configuracion = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  if (!configuracion.apiKey || !configuracion.appId) {
    throw new Error("Firebase web no está configurado (faltan NEXT_PUBLIC_FIREBASE_*).");
  }
  const app = getApps().length > 0 ? getApp() : initializeApp(configuracion);
  return getAuth(app);
}
