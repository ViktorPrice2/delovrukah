const FALLBACK_API_BASE_URL = "http://localhost:3001" as const;

function normalizeBaseUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

let cachedBaseUrl: string | undefined;

export function getApiBaseUrl(): string {
  if (cachedBaseUrl) {
    return cachedBaseUrl;
  }

  const envValue =
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    process.env.API_BASE_URL?.trim();

  if (envValue) {
    cachedBaseUrl = normalizeBaseUrl(envValue);
    return cachedBaseUrl;
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "NEXT_PUBLIC_API_BASE_URL is not defined. Falling back to http://localhost:3001."
    );
  }

  cachedBaseUrl = FALLBACK_API_BASE_URL;
  return cachedBaseUrl;
}
