/** Distancia geográfica entre dos coordenadas (fórmula de haversine). */
const RADIO_TIERRA_M = 6_371_000;

function aRadianes(grados: number): number {
  return (grados * Math.PI) / 180;
}

/** Distancia en metros entre dos puntos (lat/lng en grados decimales). */
export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = aRadianes(lat2 - lat1);
  const dLng = aRadianes(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRadianes(lat1)) * Math.cos(aRadianes(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIO_TIERRA_M * Math.asin(Math.sqrt(a));
}

/** Regla del radio: estar sobre el borde cuenta como dentro. */
export function dentroDelRadio(distanciaM: number, radioM: number): boolean {
  return distanciaM <= radioM;
}
