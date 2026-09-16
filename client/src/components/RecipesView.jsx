import PropTypes from 'prop-types'
import { useEffect, useRef, useState } from 'react'
import ChipRow from './ChipRow.jsx'
import RecipeCard from './RecipeCard.jsx'
import { DAY_NAMES, DIETARY_TAGS, MEAL_TYPE_OPTIONS } from '../constants.js'
import { capitalise } from '../util.js'

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
  onAddRecipe,
}) {
  const [searchValue, setSearchValue] = useState('')
  const [sortOrder, setSortOrder] = useState('default')
  const debounceRef = useRef()

  const sortedRecipes = [...recipes].sort((a, b) => {
    if (sortOrder === 'default') return 0
    const comparison = a.name.localeCompare(b.name)
    return sortOrder === 'za' ? -comparison : comparison
  })

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => onSearch(searchValue.trim()), 200)
    return () => clearTimeout(debounceRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue])

  return (
    <section className="view is-active">
      <p className="view-lede">
        Find something to eat, or add one of your own. Set what suits your household once and we&rsquo;ll remember it.
      </p>

      <div className="filter-panel">
        <div className="filter-row filter-search-row">
          <input
            type="search"
            placeholder="Search recipes…"
            aria-label="Search recipes"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          <button type="button" className="link-btn" onClick={onAddRecipe}>
            Add your own recipe
          </button>
        </div>
        <div className="filter-row">
          <span className="filter-label">Suits us:</span>
          <ChipRow options={DIETARY_TAGS} selected={dietaryPrefs} onToggle={onToggleDietary} ariaLabel="Dietary preferences" />
        </div>
        <div className="filter-row">
          <span className="filter-label">Meal:</span>
          <ChipRow options={MEAL_TYPE_OPTIONS} selected={mealTypeFilter} onToggle={onToggleMealType} ariaLabel="Meal type" />
        </div>
        <div className="filter-row sort-row">
          <label htmlFor="recipe-sort">Sort by:</label>
          <select id="recipe-sort" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="default">Default</option>
            <option value="az">Name (A-Z)</option>
            <option value="za">Name (Z-A)</option>
          </select>
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
        {sortedRecipes.map((recipe) => (
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

RecipesView.propTypes = {
  recipes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      serves: PropTypes.number.isRequired,
      cuisine: PropTypes.string,
      mealType: PropTypes.arrayOf(PropTypes.string).isRequired,
      dietary: PropTypes.arrayOf(PropTypes.string).isRequired,
      tags: PropTypes.arrayOf(PropTypes.string).isRequired,
      isCustom: PropTypes.bool,
    })
  ).isRequired,
  dietaryPrefs: PropTypes.arrayOf(PropTypes.string).isRequired,
  onToggleDietary: PropTypes.func.isRequired,
  mealTypeFilter: PropTypes.arrayOf(PropTypes.string).isRequired,
  onToggleMealType: PropTypes.func.isRequired,
  onSearch: PropTypes.func.isRequired,
  pendingPlan: PropTypes.shape({
    dayIndex: PropTypes.number.isRequired,
    mealSlot: PropTypes.string.isRequired,
  }),
  onCancelPending: PropTypes.func.isRequired,
  onOpenRecipe: PropTypes.func.isRequired,
  onQuickAddToPending: PropTypes.func.isRequired,
  onAddRecipe: PropTypes.func.isRequired,
}

