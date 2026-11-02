import { useCallback, useEffect, useState } from 'react'

// Loads data with load() whenever deps change. reload() fetches again.
export function useFetch(load, deps) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let active = true
    setState((prev) => ({ ...prev, loading: true, error: null }))
    load().then(
      (data) => active && setState({ data, error: null, loading: false }),
      (error) => active && setState((prev) => ({ ...prev, error, loading: false })),
    )
    return () => {
      active = false
    }
  }, [...deps, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  return { ...state, reload }
}
