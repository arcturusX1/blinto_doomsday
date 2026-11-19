const BASE = `${import.meta.env.VITE_API_URL ?? ''}/api`

// An error response from the API: `{ error: code, message }`.
export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export async function request<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const hasBody = options.body !== undefined
  const res = await fetch(BASE + path, {
    method: options.method ?? 'GET',
    headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
    body: hasBody ? JSON.stringify(options.body) : undefined,
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new ApiError(res.status, body?.error ?? 'UNKNOWN', body?.message ?? `Request failed (${res.status})`)
  }
  return body as T
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}
