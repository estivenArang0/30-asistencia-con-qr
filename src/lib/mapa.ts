/** Enlace de Google Maps para verificar una coordenada concreta. */
export function urlMapa(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
