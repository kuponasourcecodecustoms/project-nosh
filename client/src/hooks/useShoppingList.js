import { useCallback, useEffect, useState } from 'react'
import { api } from '../api.js'

export function useShoppingList() {
  const [list, setList] = useState(null)
  const [refreshTick, setRefreshTick] = useState(0)
  const refresh = useCallback(() => setRefreshTick((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    api.getShoppingList().then((data) => {
      if (!cancelled) setList(data)
    })
    return () => {
      cancelled = true
    }
  }, [refreshTick])

  return { list, refreshShoppingList: refresh }
}
