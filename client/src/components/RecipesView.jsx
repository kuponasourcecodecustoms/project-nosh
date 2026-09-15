import { useEffect, useRef, useState } from 'react'
import ChipRow from './ChipRow.jsx'
import RecipeCard from './RecipeCard.jsx'
import { DAY_NAMES, DIETARY_TAGS, MEAL_TYPE_OPTIONS, capitalise } from '../lib.js'

export default function RecipesView({
  recipes,
  dietaryPrefs,
  onToggleDietary,
  mealTypeFilter,
  onToggleMealType,
  onSearch,
  pendingPlan,
  onCancelPending,
  onOpenRecipe,
  onQuickAddToPending,
}) {
  const [searchValue, setSearchValue] = useState('')
  const debounceRef = useRef()

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => onSearch(searchValue.trim()), 200)
    return () => clearTimeout(debounceRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue])

  return (
    <section className="view is-active">
      <p className="view-lede">
        Find something for tonight, or add one of your own. Set what suits your household once and we&rsquo;ll
        remember it.
      </p>

      <div className="filter-panel">
        <div className="filter-row">
          <input
            type="search"
            placeholder="Search recipes…"
            aria-label="Search recipes"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
        <div className="filter-row">
          <span className="filter-label">Suits us:</span>
          <ChipRow options={DIETARY_TAGS} selected={dietaryPrefs} onToggle={onToggleDietary} ariaLabel="Dietary preferences" />
        </div>
        <div className="filter-row">
          <span className="filter-label">Meal:</span>
          <ChipRow options={MEAL_TYPE_OPTIONS} selected={mealTypeFilter} onToggle={onToggleMealType} ariaLabel="Meal type" />
        </div>
      </div>

      {pendingPlan && (
        <div className="planning-banner">
          Picking a recipe for <strong>{DAY_NAMES[pendingPlan.dayIndex]}, {capitalise(pendingPlan.mealSlot)}</strong>.
          <button type="button" className="link-btn" onClick={onCancelPending}>
            {' '}Cancel
          </button>
        </div>
      )}

      <div className="recipe-list" aria-live="polite">
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            isPendingSlot={!!pendingPlan}
            onOpen={onOpenRecipe}
            onQuickAdd={pendingPlan ? onQuickAddToPending : onOpenRecipe}
          />
        ))}
      </div>

      {recipes.length === 0 && (
        <p className="empty-state">No recipes match yet. Try clearing a filter, or add your own.</p>
      )}
    </section>
  )
}
