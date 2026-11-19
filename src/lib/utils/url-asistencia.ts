/** URL absoluta que abre el formulario de asistencia desde el QR. */
export function urlAsistencia(origen: string, token: string): string {
  const base = origen.replace(/\/+$/, "");
  return `${base}/asistir/${token}`;
}
