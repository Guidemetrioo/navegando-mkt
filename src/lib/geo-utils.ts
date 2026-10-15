/**
 * Utilitários de Geolocalização & Cálculo de Distância (Haversine)
 */

export const MAX_GEOFENCE_RADIUS_METERS = 300; // Raio máximo de tolerância para ponto "No Local"

/**
 * Calcula a distância em metros entre duas coordenadas geográficas
 * utilizando a fórmula de Haversine.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Raio da Terra em metros
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Formata distância em metros para exibição amigável (ex: "45 m" ou "1.2 km")
 */
export function formatDistance(meters?: number | null): string {
  if (meters === undefined || meters === null || isNaN(meters)) return 'N/D';
  if (meters < 1000) {
    return `${meters} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Coordenadas padrão de referência para os restaurantes cadastrados
 */
export const DEFAULT_CLIENT_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'cli-1': { lat: -23.5605, lng: -46.5985 }, // Cantina Bella Massa (Mooca)
  'cli-2': { lat: -23.5412, lng: -46.5701 }, // Sushi Hoshi (Tatuapé)
  'cli-3': { lat: -23.5891, lng: -46.6083 }, // Churrascaria Fogo Nobre (Ipiranga)
  'cli-4': { lat: -23.5638, lng: -46.6854 }, // Café Grão Real (Pinheiros)
  'cli-5': { lat: -23.5592, lng: -46.6912 }, // Hamburgueria Artesanal Smash (Vila Madalena)
  'cli-6': { lat: -23.5574, lng: -46.6478 }, // Bar do Porto (Bela Vista)
};
