const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    ...options,
  })
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      if (body.error) message = body.error
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new Error(message)
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  getRecipes: (params) => request(`/recipes?${new URLSearchParams(params).toString()}`),
  addRecipe: (recipe) =>
    request('/recipes', {
      method: 'POST',
      body: JSON.stringify({ ...recipe, mealType: ['own'] }),
    }),
  deleteRecipe: (id) => request(`/recipes/${id}`, { method: 'DELETE' }),

  getPreferences: () => request('/preferences'),
  setPreferences: (dietary) => request('/preferences', { method: 'PUT', body: JSON.stringify({ dietary }) }),

  getPlan: () => request('/plan'),
  setPlanSlot: (dayIndex, mealSlot, recipeId, serves) =>
    request(`/plan/${dayIndex}/${mealSlot}`, {
      method: 'PUT',
      body: JSON.stringify({ recipeId, serves }),
    }),
  clearPlanSlot: (dayIndex, mealSlot) => request(`/plan/${dayIndex}/${mealSlot}`, { method: 'DELETE' }),
  clearPlan: () => request('/plan', { method: 'DELETE' }),

  getShoppingList: () => request('/shopping-list'),
  setPantryItem: (itemName, haveIt) =>
    request(`/pantry/${encodeURIComponent(itemName)}`, { method: 'PUT', body: JSON.stringify({ haveIt }) }),
}
