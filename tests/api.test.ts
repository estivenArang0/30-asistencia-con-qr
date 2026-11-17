import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { GET as getYo } from "@/app/api/auth/yo/route";
import { POST as postAsistencias } from "@/app/api/asistencias/route";
import { GET as getSesiones, POST as postSesiones } from "@/app/api/sesiones/route";
import { GET as getAsistentes } from "@/app/api/sesiones/[id]/asistentes/route";
import { GET as getQr } from "@/app/api/sesiones/[id]/qr/route";
import {
  RepositorioAsistenciasEnMemoria,
  reemplazarRepositorioAsistencias,
} from "@/repositories/asistencias";
import {
  RepositorioSesionesEnMemoria,
  reemplazarRepositorioSesiones,
} from "@/repositories/sesiones";
import { generarToken } from "@/services/qr-token";

const SECRETO = "secreto-de-prueba-123456";
const entornoOriginal = {
  AUTH_DEV: process.env.AUTH_DEV,
  QR_SECRET: process.env.QR_SECRET,
};

const DOCENTE = "dev.doc1.docente";
const OTRO_DOCENTE = "dev.doc2.docente";
const ESTUDIANTE = "dev.est1.estudiante";

interface CuerpoError {
  error: string;
  detalles?: { campo: string; mensaje: string }[];
}

interface CuerpoSesion {
  id: string;
  docenteUid: string;
}

interface CuerpoQr {
  token: string;
  expiraEnMs: number;
}

interface CuerpoAsistencia {
  distanciaM: number;
}

interface CuerpoAsistentes {
  asistentes: { uid: string }[];
}

function peticion(
  ruta: string,
  opciones: { metodo?: string; token?: string; cuerpo?: unknown } = {},
): Request {
  const cabeceras: Record<string, string> = {};
  if (opciones.token) cabeceras.Authorization = `Bearer ${opciones.token}`;
  if (opciones.cuerpo !== undefined) cabeceras["Content-Type"] = "application/json";
  return new Request(`http://localhost${ruta}`, {
    method: opciones.metodo ?? "GET",
    headers: cabeceras,
    body: opciones.cuerpo === undefined ? undefined : JSON.stringify(opciones.cuerpo),
  });
}

function contexto(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

function cuerpoSesion(extra: Record<string, unknown> = {}) {
  const ahora = Date.now();
  return {
    curso: "Cálculo I",
    lat: 0,
    lng: 0,
    radioM: 100,
    inicia: new Date(ahora - 3_600_000).toISOString(),
    termina: new Date(ahora + 3_600_000).toISOString(),
    ...extra,
  };
}

async function crearSesion(token = DOCENTE, extra: Record<string, unknown> = {}) {
  const respuesta = await postSesiones(
    peticion("/api/sesiones", { metodo: "POST", token, cuerpo: cuerpoSesion(extra) }),
    undefined,
  );
  // Se lee una sola vez: el cuerpo de una Response no se puede consumir dos veces.
  const cuerpo = JSON.parse(await respuesta.text()) as unknown;
  return { respuesta, sesion: cuerpo as CuerpoSesion, cuerpo };
}

beforeEach(() => {
  process.env.AUTH_DEV = "1";
  process.env.QR_SECRET = SECRETO;
  reemplazarRepositorioSesiones(new RepositorioSesionesEnMemoria());
  reemplazarRepositorioAsistencias(new RepositorioAsistenciasEnMemoria());
});

afterAll(() => {
  if (entornoOriginal.AUTH_DEV === undefined) delete process.env.AUTH_DEV;
  else process.env.AUTH_DEV = entornoOriginal.AUTH_DEV;
  if (entornoOriginal.QR_SECRET === undefined) delete process.env.QR_SECRET;
  else process.env.QR_SECRET = entornoOriginal.QR_SECRET;
});

describe("API REST de asistencia", () => {
  it("401 sin token", async () => {
    const respuesta = await getYo(peticion("/api/auth/yo"), undefined);
    expect(respuesta.status).toBe(401);
  });

  it("el verificador por defecto rechaza todo si falta AUTH_DEV", async () => {
    delete process.env.AUTH_DEV;
    const respuesta = await getYo(peticion("/api/auth/yo", { token: DOCENTE }), undefined);
    expect(respuesta.status).toBe(401);
  });

  it("400 por campo desconocido (el cliente no puede fijar docenteUid)", async () => {
    const { respuesta, cuerpo } = await crearSesion(DOCENTE, { docenteUid: "intruso" });
    expect(respuesta.status).toBe(400);
    const error = cuerpo as CuerpoError;
    expect(error.detalles?.some((detalle) => detalle.campo === "docenteUid")).toBe(true);
  });

  it("400 por coordenadas inválidas", async () => {
    const { respuesta } = await crearSesion(DOCENTE, { lat: 120 });
    expect(respuesta.status).toBe(400);
  });

  it("criterio 4: el estudiante no puede ver la lista de asistentes (403)", async () => {
    const { sesion } = await crearSesion();
    const respuesta = await getAsistentes(
      peticion(`/api/sesiones/${sesion.id}/asistentes`, { token: ESTUDIANTE }),
      contexto(sesion.id),
    );
    expect(respuesta.status).toBe(403);
  });

  it("404 para un docente que no es dueño de la sesión", async () => {
    const { sesion } = await crearSesion();
    const respuesta = await getQr(
      peticion(`/api/sesiones/${sesion.id}/qr`, { token: OTRO_DOCENTE }),
      contexto(sesion.id),
    );
    expect(respuesta.status).toBe(404);
  });

  it("criterio 1: un QR de hace 2 minutos da 410", async () => {
    const { sesion } = await crearSesion();
    const token = generarToken(sesion.id, SECRETO, Date.now() - 120_000);
    const respuesta = await postAsistencias(
      peticion("/api/asistencias", {
        metodo: "POST",
        token: ESTUDIANTE,
        cuerpo: { token, lat: 0, lng: 0 },
      }),
      undefined,
    );
    expect(respuesta.status).toBe(410);
  });

  it("criterio 3: el segundo registro del mismo uid da 409", async () => {
    const { sesion } = await crearSesion();
    const qr = await getQr(
      peticion(`/api/sesiones/${sesion.id}/qr`, { token: DOCENTE }),
      contexto(sesion.id),
    );
    const { token } = (await qr.json()) as CuerpoQr;

    const primera = await postAsistencias(
      peticion("/api/asistencias", {
        metodo: "POST",
        token: ESTUDIANTE,
        cuerpo: { token, lat: 0, lng: 0 },
      }),
      undefined,
    );
    expect(primera.status).toBe(201);

    const segunda = await postAsistencias(
      peticion("/api/asistencias", {
        metodo: "POST",
        token: ESTUDIANTE,
        cuerpo: { token, lat: 0, lng: 0 },
      }),
      undefined,
    );
    expect(segunda.status).toBe(409);
  });

  it("integración: docente crea sesión, pide QR, estudiante registra y el docente ve la lista", async () => {
    const { respuesta, sesion } = await crearSesion();
    expect(respuesta.status).toBe(201);
    expect(sesion.docenteUid).toBe("doc1");

    const qr = await getQr(
      peticion(`/api/sesiones/${sesion.id}/qr`, { token: DOCENTE }),
      contexto(sesion.id),
    );
    expect(qr.status).toBe(200);
    const { token, expiraEnMs } = (await qr.json()) as CuerpoQr;
    expect(token.length).toBeGreaterThan(0);
    expect(expiraEnMs).toBeGreaterThan(Date.now());

    const registro = await postAsistencias(
      peticion("/api/asistencias", {
        metodo: "POST",
        token: ESTUDIANTE,
        cuerpo: { token, lat: 0.0002, lng: 0 },
      }),
      undefined,
    );
    expect(registro.status).toBe(201);
    const { distanciaM } = (await registro.json()) as CuerpoAsistencia;
    expect(distanciaM).toBeLessThan(100);

    const lista = await getAsistentes(
      peticion(`/api/sesiones/${sesion.id}/asistentes`, { token: DOCENTE }),
      contexto(sesion.id),
    );
    expect(lista.status).toBe(200);
    const { asistentes } = (await lista.json()) as CuerpoAsistentes;
    expect(asistentes).toHaveLength(1);
    expect(asistentes[0]?.uid).toBe("est1");

    const propias = await getSesiones(peticion("/api/sesiones", { token: DOCENTE }), undefined);
    expect(propias.status).toBe(200);
  });
});
