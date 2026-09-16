import { useCallback, useEffect, useState } from 'react'
import { api } from '../api.js'

export function usePreferences() {
  const [dietary, setDietary] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    api.getPreferences().then((prefs) => {
      if (!cancelled) {
        setDietary(prefs.dietary)
        setLoaded(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const toggle = useCallback(
    async (key) => {
      const next = dietary.includes(key) ? dietary.filter((d) => d !== key) : [...dietary, key]
      setDietary(next)
      await api.setPreferences(next)
    },
    [dietary],
  )

  return { dietary, toggle, loaded }
}
