/** Destino interno permitido tras el login; evita open redirects. */
export function destinoSeguro(valor: string | null | undefined): string {
  if (!valor) return "/";
  if (!valor.startsWith("/") || valor.startsWith("//")) return "/";
  if (valor.includes("://") || valor.includes("\\")) return "/";
  if (/[\u0000-\u001f]/.test(valor)) return "/";
  return valor;
}
