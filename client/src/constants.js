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
  { key: 'own', label: 'Own recipes' },
]

export const RECIPE_FORM_MEAL_TYPE_OPTIONS = MEAL_TYPE_OPTIONS.filter((option) => option.key !== 'own')
