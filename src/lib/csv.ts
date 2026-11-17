/**
 * CSV seguro: cada celda va entre comillas y, si empieza por = + - @ (o un
 * carácter de control), se prefija con un apóstrofo para que la hoja de
 * cálculo no la ejecute como fórmula.
 */
const INICIO_PELIGROSO = /^[=+\-@\t\r]/;

export function escaparCelda(valor: string): string {
  const texto = INICIO_PELIGROSO.test(valor) ? `'${valor}` : valor;
  return `"${texto.replaceAll('"', '""')}"`;
}

export function aCsv(filas: readonly (readonly string[])[]): string {
  return filas.map((fila) => fila.map(escaparCelda).join(",")).join("\r\n") + "\r\n";
}
