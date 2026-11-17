/** Envoltorio de Route Handlers: errores homogéneos, sin caché y check de Origin. */
import { ZodError } from "zod";
import { AppError } from "@/lib/errores";

export interface DetalleError {
  campo: string;
  mensaje: string;
}

interface CuerpoError {
  error: string;
  detalles?: DetalleError[];
}

type Handler<Ctx> = (request: Request, contexto: Ctx) => Promise<Response>;
type HandlerExportado<Ctx> = (request: Request, contexto?: Ctx) => Promise<Response>;

const METODOS_CON_ORIGEN = new Set(["POST", "PUT", "DELETE"]);

function origenPermitido(request: Request): boolean {
  const origen = request.headers.get("origin");
  if (!origen) return true;
  try {
    return new URL(origen).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

/** Reconoce AppError incluso si el bundler duplica la clase entre chunks. */
function esAppError(error: unknown): error is AppError {
  if (error instanceof AppError) return true;
  if (typeof error !== "object" || error === null) return false;
  const candidato = error as {
    esAppError?: unknown;
    status?: unknown;
    message?: unknown;
  };
  return (
    candidato.esAppError === true &&
    typeof candidato.status === "number" &&
    typeof candidato.message === "string"
  );
}

function traducir(error: unknown): { status: number; cuerpo: CuerpoError } {
  if (esAppError(error)) {
    return { status: error.status, cuerpo: { error: error.message } };
  }
  if (error instanceof ZodError) {
    return {
      status: 400,
      cuerpo: {
        error: "Los datos enviados no son válidos.",
        detalles: error.issues.flatMap((problema) => {
          // Zod reporta las claves desconocidas en `keys`, sin ruta: se expanden.
          if (problema.code === "unrecognized_keys") {
            return problema.keys.map((clave) => ({
              campo: clave,
              mensaje: `El campo "${clave}" no está permitido.`,
            }));
          }
          return [
            {
              campo: problema.path.join(".") || "(raíz)",
              mensaje: problema.message,
            },
          ];
        }),
      },
    };
  }
  // Nunca se devuelven detalles internos al cliente.
  return { status: 500, cuerpo: { error: "Error interno del servidor." } };
}

/** Envuelve un handler: traduce errores y sella la respuesta con no-store. */
export function manejar<Ctx = unknown>(handler: Handler<Ctx>): HandlerExportado<Ctx> {
  return async (request, contexto) => {
    const idPeticion = crypto.randomUUID().slice(0, 8);
    try {
      if (METODOS_CON_ORIGEN.has(request.method) && !origenPermitido(request)) {
        throw new AppError(403, "ORIGEN", "El origen de la petición no es válido.");
      }
      const respuesta = await handler(request, contexto as Ctx);
      respuesta.headers.set("Cache-Control", "no-store");
      return respuesta;
    } catch (error) {
      const { status, cuerpo } = traducir(error);
      // Log sin tokens ni datos personales: solo id de petición, método y estado.
      console.error(`[api ${idPeticion}] ${request.method} ${status}`);
      if (status >= 500) {
        // Solo la causa: sin stack, cuerpo, cabeceras, cookies, tokens ni entorno.
        const nombre = error instanceof Error ? error.name : typeof error;
        const codigo =
          typeof error === "object" && error !== null
            ? String(
                ("code" in error ? (error as { code?: unknown }).code : undefined) ??
                  ("codigo" in error ? (error as { codigo?: unknown }).codigo : undefined) ??
                  "",
              )
            : "";
        const mensaje = String(error instanceof Error ? error.message : error)
          .replace(/\s+/g, " ")
          .slice(0, 200);
        console.error(
          `[api ${idPeticion}] causa ${nombre}${codigo ? ` code=${codigo}` : ""} ${mensaje}`,
        );
      }
      return Response.json(cuerpo, { status, headers: { "Cache-Control": "no-store" } });
    }
  };
}

/** Lee el cuerpo JSON; 400 si no es JSON válido. */
export async function leerJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AppError(400, "JSON", "El cuerpo de la petición no es JSON válido.");
  }
}
