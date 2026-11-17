/**
 * Token QR firmado (RF-02). Solo servidor: usa `node:crypto`.
 *
 * Decisión de intervalo: el documento mezcla "30 s" (RF-02) y "minuto ±1" (§9.4).
 * Se usa un intervalo de 30 s (RF-02, la regla operativa más concreta) con una
 * tolerancia de ±2 intervalos, es decir ±60 s: eso cubre el "minuto ±1" de §9.4
 * sin aceptar códigos de 90 s o más.
 *
 * El secreto se recibe por parámetro; este módulo nunca lee variables de entorno.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { AppError } from "@/lib/errores";

export const DURACION_INTERVALO_MS = 30_000;
export const TOLERANCIA_INTERVALOS = 2;

export function intervaloDe(ahoraMs: number): number {
  return Math.floor(ahoraMs / DURACION_INTERVALO_MS);
}

function firmar(sesionId: string, intervalo: number, secreto: string): string {
  return createHmac("sha256", secreto).update(`${sesionId}.${intervalo}`).digest("hex");
}

export function generarToken(sesionId: string, secreto: string, ahoraMs: number): string {
  const intervalo = intervaloDe(ahoraMs);
  const firma = firmar(sesionId, intervalo, secreto);
  return Buffer.from(`${sesionId}.${intervalo}.${firma}`, "utf8").toString("base64url");
}

export function verificarToken(
  token: string,
  secreto: string,
  ahoraMs: number,
): { sesionId: string } {
  const errorFormato = () =>
    new AppError(400, "FORMATO", "El código QR no tiene un formato válido.");

  const partes = Buffer.from(token, "base64url").toString("utf8").split(".");
  if (partes.length !== 3) throw errorFormato();

  const [sesionId, intervaloTexto, firma] = partes;
  if (!sesionId || !/^\d+$/.test(intervaloTexto) || !/^[0-9a-f]{64}$/.test(firma)) {
    throw errorFormato();
  }

  const intervalo = Number(intervaloTexto);
  const esperada = Buffer.from(firmar(sesionId, intervalo, secreto), "hex");
  const recibida = Buffer.from(firma, "hex");
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) {
    throw new AppError(401, "FIRMA", "La firma del código QR no es válida.");
  }

  if (Math.abs(intervaloDe(ahoraMs) - intervalo) > TOLERANCIA_INTERVALOS) {
    throw new AppError(410, "VENCIDO", "El código QR venció. Pide uno nuevo al docente.");
  }

  return { sesionId };
}
