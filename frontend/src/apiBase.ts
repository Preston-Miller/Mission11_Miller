/**
 * Base URL for the ASP.NET API. Trailing slashes are stripped.
 *
 * If `VITE_API_BASE_URL` is missing at build time (common in CI), a deployed HTTPS site
 * would otherwise fall back to localhost — the browser blocks that (mixed content) as "Failed to fetch".
 */
const PRODUCTION_API_FALLBACK = 'https://bookstore-miller-backend.azurewebsites.net'

function resolveApiBase(): string {
  const raw = import.meta.env.VITE_API_BASE_URL
  const trimmed = typeof raw === 'string' ? raw.trim() : ''
  if (trimmed) {
    return trimmed.replace(/\/+$/, '')
  }
  if (import.meta.env.PROD) {
    return PRODUCTION_API_FALLBACK
  }
  return 'http://localhost:5076'
}

export const API_BASE_URL = resolveApiBase()
