"use client";

export type Rol = "docente" | "estudiante";

export interface UsuarioDev {
  uid: string;
  rol: Rol;
}

const CLAVE = "token";

export class ErrorApi extends Error {
  readonly status: number;

  constructor(status: number, mensaje: string) {
    super(mensaje);
    this.name = "ErrorApi";
    this.status = status;
  }
}

export function guardarToken(token: string): void {
  sessionStorage.setItem(CLAVE, token);
}

export function borrarToken(): void {
  sessionStorage.removeItem(CLAVE);
}

export function leerToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(CLAVE);
}

/** Los tokens dev tienen la forma `dev.<uid>.<rol>`. */
export function usuarioDelToken(token: string | null): UsuarioDev | null {
  if (!token) return null;
  const [esquema, uid, rol] = token.split(".");
  if (esquema !== "dev" || !uid) return null;
  if (rol !== "docente" && rol !== "estudiante") return null;
  return { uid, rol };
}

async function mensajeDeError(respuesta: Response): Promise<string> {
  try {
    const cuerpo = (await respuesta.json()) as { error?: string };
    return cuerpo.error ?? "La petición falló.";
  } catch {
    return "La petición falló.";
  }
}

export async function pedir<T>(ruta: string, init: RequestInit = {}): Promise<T> {
  const token = leerToken();
  const cabeceras = new Headers(init.headers);
  if (token) cabeceras.set("Authorization", `Bearer ${token}`);
  if (init.body) cabeceras.set("Content-Type", "application/json");

  const respuesta = await fetch(ruta, { ...init, headers: cabeceras, cache: "no-store" });
  if (!respuesta.ok) throw new ErrorApi(respuesta.status, await mensajeDeError(respuesta));
  return (await respuesta.json()) as T;
}
