/** Esquemas Zod de la asistencia. Se validan siempre en el servidor. */
import { z } from "zod";

const fechaIso = z
  .string()
  .refine((valor) => !Number.isNaN(Date.parse(valor)), {
    message: "La fecha debe estar en formato ISO 8601.",
  });

/** Datos que envía el estudiante al escanear el QR. */
export const esquemaAsistencia = z
  .object({
    token: z.string().min(1, "El token es obligatorio."),
    lat: z.number().min(-90, "La latitud va de -90 a 90.").max(90, "La latitud va de -90 a 90."),
    lng: z
      .number()
      .min(-180, "La longitud va de -180 a 180.")
      .max(180, "La longitud va de -180 a 180."),
  })
  .strict();

/** Datos de una sesión de asistencia creada por el docente. */
export const esquemaSesion = z
  .object({
    curso: z.string().min(1, "El curso es obligatorio."),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    radioM: z.number().positive("El radio debe ser mayor que cero."),
    inicia: fechaIso,
    termina: fechaIso,
  })
  .strict();

export type DatosAsistenciaEntrada = z.infer<typeof esquemaAsistencia>;
export type DatosSesionEntrada = z.infer<typeof esquemaSesion>;
