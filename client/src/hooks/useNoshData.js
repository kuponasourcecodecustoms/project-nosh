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
      setDietary(next) // optimistic
      await api.setPreferences(next)
    },
    [dietary],
  )

  return { dietary, toggle, loaded }
}

export function useRecipes({ dietary, mealType, query }) {
  const [recipes, setRecipes] = useState([])
  const [refreshTick, setRefreshTick] = useState(0)
  const refresh = useCallback(() => setRefreshTick((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    const params = {}
    if (dietary.length) params.dietary = dietary.join(',')
    if (mealType.length) params.mealType = mealType.join(',')
    if (query) params.q = query
    api.getRecipes(params).then((data) => {
      if (!cancelled) setRecipes(data)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dietary.join(','), mealType.join(','), query, refreshTick])

  return { recipes, refreshRecipes: refresh }
}

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
