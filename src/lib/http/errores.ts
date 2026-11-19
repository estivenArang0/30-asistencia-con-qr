/**
 * Error de aplicación con estado HTTP y código de negocio.
 * Los servicios puros lo lanzan; la capa de ruta lo traduce a una respuesta JSON.
 */
export class AppError extends Error {
  readonly esAppError = true;
  readonly status: number;
  readonly codigo: string;

  constructor(status: number, codigo: string, mensaje: string) {
    super(mensaje);
    this.name = "AppError";
    this.status = status;
    this.codigo = codigo;
  }
}
