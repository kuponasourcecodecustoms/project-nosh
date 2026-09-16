import PropTypes from 'prop-types'
import { capitalise, dietaryLabel } from '../util.js'

export default function RecipeCard({ recipe, isPendingSlot, onOpen, onQuickAdd }) {
  const handleQuickAdd = (e) => {
    e.stopPropagation()
    onQuickAdd(recipe)
  }

  return (
    <article
      className="recipe-card"
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
      <div className="recipe-card-top">
        <div>
          <h3 className="recipe-name">{recipe.name}</h3>
          <div className="recipe-meta">
            {recipe.cuisine ? `Serves ${recipe.serves}, ${capitalise(recipe.cuisine)}` : `Serves ${recipe.serves}`}
          </div>
        </div>
      </div>

      <div className="tag-row">
        {recipe.mealType.map((m) => (
          <span key={m} className="tag tag-meal">
            {capitalise(m)}
          </span>
        ))}
        {recipe.dietary.map((d) => (
          <span key={d} className="tag tag-diet">
            {dietaryLabel(d)}
          </span>
        ))}
        {recipe.tags.map((t) => (
          <span key={t} className="tag tag-note">
            {capitalise(t.replace(/-/g, ' '))}
          </span>
        ))}
        {recipe.isCustom && <span className="tag tag-custom">Yours</span>}
      </div>

      <div className="recipe-card-actions">
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

