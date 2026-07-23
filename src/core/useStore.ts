import { useCallback, useEffect, useRef, useState } from 'react'

type Updater<T> = T | ((prev: T) => T)

/**
 * Persiste el estado de una feature en la memoria de la página
 * (data/store.json, vía /api/data/:key). Devuelve [valor, set, cargado].
 * Claude lee ese mismo fichero, así que todo lo que guardes aquí forma parte
 * de la "memoria" que él tiene presente.
 */
export function useStore<T>(key: string, initial: T): [T, (v: Updater<T>) => void, boolean] {
  const [value, setValue] = useState<T>(initial)
  const [loaded, setLoaded] = useState(false)
  const latest = useRef(value)
  latest.current = value

  useEffect(() => {
    let cancelled = false
    fetch(`/api/data/${encodeURIComponent(key)}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        if (d && d.value !== undefined && d.value !== null) setValue(d.value as T)
        setLoaded(true)
      })
      .catch(() => !cancelled && setLoaded(true))
    return () => {
      cancelled = true
    }
  }, [key])

  const update = useCallback(
    (v: Updater<T>) => {
      const next = typeof v === 'function' ? (v as (prev: T) => T)(latest.current) : v
      latest.current = next
      setValue(next)
      fetch(`/api/data/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: next }),
      }).catch(() => {})
    },
    [key],
  )

  return [value, update, loaded]
}
