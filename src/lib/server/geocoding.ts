export interface StreetAddress { street: string; address: string; provider: 'geoapify'; }
const cache = new Map<string, { expires: number; value: StreetAddress }>();
export async function reverseStreet(lat: number, lng: number): Promise<StreetAddress | null> {
  if (!process.env.GEOAPIFY_API_KEY) return null;
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.value;
  const url = new URL('https://api.geoapify.com/v1/geocode/reverse');
  url.search = new URLSearchParams({ lat: String(lat), lon: String(lng), apiKey: process.env.GEOAPIFY_API_KEY, format: 'json', lang: 'pt' }).toString();
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000), cache: 'no-store' });
    if (!response.ok) return null;
    const data = await response.json();
    const result = data.results?.[0];
    if (typeof result?.street !== 'string' || !result.street.trim()) return null;
    const value: StreetAddress = { street: result.street, address: result.formatted || result.street, provider: 'geoapify' };
    if (cache.size >= 1000) cache.clear();
    cache.set(key, { expires: Date.now() + 86400000, value });
    return value;
  } catch { return null; }
}
