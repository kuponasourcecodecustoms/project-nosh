export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner']

export const DIETARY_TAGS = [
  { key: 'vegetarian', label: 'Vegetarian' },
  { key: 'vegan', label: 'Vegan' },
  { key: 'gluten-free', label: 'Gluten-free' },
  { key: 'dairy-free', label: 'Dairy-free' },
]

export const MEAL_TYPE_OPTIONS = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'dessert', label: 'Dessert' },
  { key: 'own', label: 'Own recipes' }
]

export function capitalise(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

export function dietaryLabel(key) {
  const found = DIETARY_TAGS.find((d) => d.key === key)
  return found ? found.label : capitalise(key)
}

export function formatIngredient(ing) {
  const parts = []
  if (ing.quantity !== null && ing.quantity !== undefined) parts.push(ing.quantity)
  if (ing.unit) parts.push(ing.unit)
  let line = parts.length ? `${parts.join(' ')} ${ing.item}` : ing.item
  if (ing.prep) line += `, ${ing.prep}`
  return line
}

// Today as a Monday-indexed (0=Mon..6=Sun) day number.
export function todayIndex() {
  return (new Date().getDay() + 6) % 7
}
