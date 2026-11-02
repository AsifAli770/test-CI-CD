import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'

// Opens a page's "add" form when the URL has ?new=1 (used by dashboard quick actions),
// then removes the flag so a refresh doesn't open it again
export function useOpenOnNew(open) {
  const [params, setParams] = useSearchParams()
  const wantsNew = params.get('new') === '1'

  useEffect(() => {
    if (!wantsNew) return
    open()
    setParams({}, { replace: true })
  }, [wantsNew, open, setParams])
}

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
