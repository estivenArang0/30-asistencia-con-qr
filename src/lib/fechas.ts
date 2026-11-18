const FORMATO = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "short",
  timeStyle: "short",
});

/** Fecha y hora en la zona local del navegador. */
export function formatearFechaHora(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "Fecha no válida";
  return FORMATO.format(fecha);
}
