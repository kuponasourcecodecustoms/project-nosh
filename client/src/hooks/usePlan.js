import { useCallback, useEffect, useState } from 'react'
import { api } from '../api.js'

export function usePlan() {
  const [plan, setPlan] = useState(null)
  const [refreshTick, setRefreshTick] = useState(0)
  const refresh = useCallback(() => setRefreshTick((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    api.getPlan().then((data) => {
      if (!cancelled) setPlan(data)
    })
    return () => {
      cancelled = true
    }
  }, [refreshTick])

  return { plan, refreshPlan: refresh }
}
