import { useEffect, useEffectEvent, useState } from 'react'
import { errorMessage } from '@/api/client'

interface Result<T> {
  key: string
  data: T | null
  error: string | null
}

// Calls `load(key)` whenever `key` changes, and again on reload(). A null key
// means there's nothing to load yet. Results are tagged with their key, so
// switching keys never shows the previous key's data.
export function useApi<T>(key: string | null, load: (key: string) => Promise<T>) {
  const [result, setResult] = useState<Result<T> | null>(null)
  const [version, setVersion] = useState(0)
  const runLoad = useEffectEvent(load)

  useEffect(() => {
    if (key === null) return
    let cancelled = false
    runLoad(key)
      .then((data) => {
        if (!cancelled) setResult({ key, data, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled) setResult({ key, data: null, error: errorMessage(err) })
      })
    return () => {
      cancelled = true
    }
  }, [key, version])

  const current = result?.key === key ? result : null
  return {
    data: current?.data ?? null,
    error: current?.error ?? null,
    loading: key !== null && current === null,
    reload: () => setVersion((v) => v + 1),
  }
}
