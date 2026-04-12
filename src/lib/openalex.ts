import { prisma } from "@/lib/db";

const BASE_URL = "https://api.openalex.org";

// Simple in-memory cache (5 minutes)
const cache = new Map<string, { data: unknown; expiresAt: number }>();

function getCached(key: string): unknown | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, expiresAt: Date.now() + 5 * 60 * 1000 });
}

/**
 * Priority order for OpenAlex API key:
 * 1. User's saved key in UserSettings (configured via /app/settings)
 * 2. OPENALEX_API_KEY environment variable (set in Vercel dashboard)
 */
export async function getOpenAlexApiKey(userId: string): Promise<string | null> {
  try {
    const settings = await prisma.userSettings.findUnique({ where: { userId } });
    if (settings?.openAlexApiKey) return settings.openAlexApiKey;
  } catch {
    // DB might not be available during build
  }
  // Fallback to environment variable — set this in Vercel dashboard
  return process.env.OPENALEX_API_KEY || null;
}

export async function openAlexRequest(
  userId: string,
  path: string,
  params: Record<string, string> = {}
): Promise<unknown> {
  const apiKey = await getOpenAlexApiKey(userId);

  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  if (apiKey) {
    url.searchParams.set("api_key", apiKey);
  }

  const cacheKey = url.toString();
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "Hodon/0.1 (mailto:admin@hodon.local)" },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 403 && !apiKey) {
      throw new Error(
        "OpenAlex requiere API key. Configúrala en Ajustes o agrega OPENALEX_API_KEY como variable de entorno en Vercel."
      );
    }
    throw new Error(`OpenAlex API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  setCache(cacheKey, data);
  return data;
}
