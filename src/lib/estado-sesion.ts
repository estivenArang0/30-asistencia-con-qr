export type EstadoSesion = "abierta" | "programada" | "terminada";

export const ETIQUETA_ESTADO: Record<EstadoSesion, string> = {
  abierta: "Abierta",
  programada: "Programada",
  terminada: "Terminada",
};

/** Estado según los límites: [inicia, termina) está abierta; en termina ya cerró. */
export function estadoSesion(inicia: string, termina: string, ahoraMs: number): EstadoSesion {
  const inicio = Date.parse(inicia);
  const fin = Date.parse(termina);
  if (!Number.isFinite(inicio) || !Number.isFinite(fin)) return "terminada";
  if (ahoraMs < inicio) return "programada";
  if (ahoraMs >= fin) return "terminada";
  return "abierta";
}

const ORDEN: Record<EstadoSesion, number> = {
  abierta: 0,
  programada: 1,
  terminada: 2,
};

/** Abiertas primero, luego programadas y al final terminadas; dentro, por inicio. */
export function ordenarSesiones<T extends { inicia: string; termina: string }>(
  sesiones: readonly T[],
  ahoraMs: number,
): T[] {
  return [...sesiones].sort((a, b) => {
    const porEstado =
      ORDEN[estadoSesion(a.inicia, a.termina, ahoraMs)] -
      ORDEN[estadoSesion(b.inicia, b.termina, ahoraMs)];
    if (porEstado !== 0) return porEstado;
    return Date.parse(a.inicia) - Date.parse(b.inicia);
  });
}
