import PropTypes from 'prop-types'
import styles from './styles.module.css'
import { capitalise, dietaryLabel } from '../../util.js'

export default function RecipeCard({ recipe, isPendingSlot, onOpen, onQuickAdd }) {
  const handleQuickAdd = (e) => {
    e.stopPropagation()
    onQuickAdd(recipe)
  }

  return (
    <article
      className={styles.recipeCard}
      tabIndex={0}
      role="button"
      aria-label={`${recipe.name} — view recipe`}
      onClick={() => onOpen(recipe)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(recipe)
        }
      }}
    >
      <div className={styles.recipeCardTop}>
        <div>
          <h3 className={styles.recipeName}>{recipe.name}</h3>
          <div className={styles.recipeMeta}>
            {recipe.cuisine ? `Serves ${recipe.serves}, ${capitalise(recipe.cuisine)}` : `Serves ${recipe.serves}`}
          </div>
        </div>
      </div>
      <div className={styles.tagRow}>
        {recipe.mealType.map((m) => (
          <span key={m} className={`${styles.tag} ${styles.tagMeal}`}>
            {capitalise(m)}
          </span>
        ))}
        {recipe.dietary.map((d) => (
          <span key={d} className={`${styles.tag} ${styles.tagDiet}`}>
            {dietaryLabel(d)}
          </span>
        ))}
        {recipe.tags.map((t) => (
          <span key={t} className={`${styles.tag} ${styles.tagNote}`}>
            {capitalise(t.replace(/-/g, ' '))}
          </span>
        ))}
        {recipe.isCustom && <span className={`${styles.tag} ${styles.tagCustom}`}>Yours</span>}
      </div>
      <div className={styles.recipeCardActions}>
        <button type="button" className="btn btn-primary btn-sm" onClick={handleQuickAdd}>
          {isPendingSlot ? 'Add to this slot' : 'View & add to plan'}
        </button>
      </div>
    </article>
  )
}

RecipeCard.propTypes = {
  recipe: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    serves: PropTypes.number.isRequired,
    cuisine: PropTypes.string,
    mealType: PropTypes.arrayOf(PropTypes.string).isRequired,
    dietary: PropTypes.arrayOf(PropTypes.string).isRequired,
    tags: PropTypes.arrayOf(PropTypes.string).isRequired,
    isCustom: PropTypes.bool,
  }).isRequired,
  isPendingSlot: PropTypes.bool.isRequired,
  onOpen: PropTypes.func.isRequired,
  onQuickAdd: PropTypes.func.isRequired,
}

