export const PRECISION_MAXIMA_M = 100;

/** Aviso textual cuando la precisión del GPS supera el umbral. */
export function mensajePrecision(accuracy: number | null): string | null {
  if (accuracy === null || !Number.isFinite(accuracy)) return null;
  if (accuracy > PRECISION_MAXIMA_M) {
    return "Ubicación poco precisa; usa un dispositivo con GPS o corrige las coordenadas a mano";
  }
  return null;
}
