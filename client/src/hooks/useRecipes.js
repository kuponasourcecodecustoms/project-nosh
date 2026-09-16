import { useCallback, useEffect, useState } from 'react'
import { api } from '../api.js'

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
