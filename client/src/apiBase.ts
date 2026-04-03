/** Base URL for the ASP.NET API. Trailing slashes are stripped. */
function resolveApiBase(): string {
  const raw = import.meta.env.VITE_API_BASE_URL
  const trimmed = typeof raw === 'string' ? raw.trim() : ''
  // `??` does not treat "" as missing — empty env would otherwise fetch /api/* from the Vite origin (404).
  if (!trimmed) {
    return 'http://localhost:5076'
  }
  return trimmed.replace(/\/+$/, '')
}

export const API_BASE_URL = resolveApiBase()
