import PropTypes from 'prop-types'
import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './styles.module.css'
import ChipRow from '../ChipRow/index.jsx'
import RecipeCard from '../RecipeCard/index.jsx'
import { DAY_NAMES, DIETARY_TAGS, MEAL_TYPE_OPTIONS } from '../../constants.js'
import { usePreferences } from '../../hooks/usePreferences.js'
import { useRecipes } from '../../hooks/useRecipes.js'
import { capitalise } from '../../util.js'

export default function RecipesView({ active, refreshToken, pendingPlan, onCancelPending, onOpenRecipe, onQuickAddToPending, onAddRecipe }) {
  const { dietary: dietaryPrefs, toggle: toggleDietaryPref, loaded: prefsLoaded } = usePreferences()
  const [mealTypeFilter, setMealTypeFilter] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchValue, setSearchValue] = useState('')
  const [sortOrder, setSortOrder] = useState('default')
  const debounceRef = useRef()
  const { recipes, refreshRecipes } = useRecipes({ dietary: dietaryPrefs, mealType: mealTypeFilter, query: searchQuery })

  const toggleMealType = useCallback((key) => {
    setMealTypeFilter((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }, [])

  const sortedRecipes = [...recipes].sort((a, b) => {
    if (sortOrder === 'default') return 0
    const comparison = a.name.localeCompare(b.name)
    return sortOrder === 'za' ? -comparison : comparison
  })

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearchQuery(searchValue.trim()), 200)
    return () => clearTimeout(debounceRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue])

  useEffect(() => {
    if (refreshToken > 0) refreshRecipes()
  }, [refreshRecipes, refreshToken])

  if (!prefsLoaded) return null

  return (
    <section className={`view${active ? ' is-active' : ''}`}>
      <p className="view-lede">
        Find something to eat, or add one of your own. Set what suits your household once and we&rsquo;ll remember it.
      </p>
      <div className={styles.filterPanel}>
        <div className={`${styles.filterRow} ${styles.filterSearchRow}`}>
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
        <div className={styles.filterRow}>
          <span className={styles.filterLabel}>Suits us:</span>
          <ChipRow options={DIETARY_TAGS} selected={dietaryPrefs} onToggle={toggleDietaryPref} ariaLabel="Dietary preferences" />
        </div>
        <div className={styles.filterRow}>
          <span className={styles.filterLabel}>Meal:</span>
          <ChipRow options={MEAL_TYPE_OPTIONS} selected={mealTypeFilter} onToggle={toggleMealType} ariaLabel="Meal type" />
        </div>
        <div className={`${styles.filterRow} ${styles.sortRow}`}>
          <label htmlFor="recipe-sort">Sort by:</label>
          <select id="recipe-sort" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="default">Default</option>
            <option value="az">Name (A-Z)</option>
            <option value="za">Name (Z-A)</option>
          </select>
        </div>
      </div>
      {pendingPlan && (
        <div className={styles.planningBanner}>
          Picking a recipe for <strong>{DAY_NAMES[pendingPlan.dayIndex]}, {capitalise(pendingPlan.mealSlot)}</strong>.
          <button type="button" className="link-btn" onClick={onCancelPending}>
            {' '}Cancel
          </button>
        </div>
      )}
      <div className={styles.recipeList} aria-live="polite">
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
  active: PropTypes.bool.isRequired,
  refreshToken: PropTypes.number.isRequired,
  pendingPlan: PropTypes.shape({
    dayIndex: PropTypes.number.isRequired,
    mealSlot: PropTypes.string.isRequired,
  }),
  onCancelPending: PropTypes.func.isRequired,
  onOpenRecipe: PropTypes.func.isRequired,
  onQuickAddToPending: PropTypes.func.isRequired,
  onAddRecipe: PropTypes.func.isRequired,
}

