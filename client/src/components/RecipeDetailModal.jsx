import PropTypes from 'prop-types'
import { useEffect, useRef, useState } from 'react'
import { DAY_NAMES, MEAL_SLOTS } from '../constants.js'
import { capitalise, dietaryLabel, formatIngredient } from '../util.js'

export default function RecipeDetailModal({ recipe, onClose, onAddToPlan, onDeleteRecipe }) {
  const dialogRef = useRef(null)
  const [dayIndex, setDayIndex] = useState(0)
  const [mealSlot, setMealSlot] = useState('dinner')
  const [plannedServes, setPlannedServes] = useState(2)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!recipe) return
    if (recipe.mealType.includes('dinner')) setMealSlot('dinner')
    else if (recipe.mealType.includes('lunch')) setMealSlot('lunch')
    else if (recipe.mealType.includes('breakfast')) setMealSlot('breakfast')
    else setMealSlot('dinner')
    setDayIndex(0)
    setPlannedServes(recipe.serves)
  }, [recipe])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (recipe) {
      if (!dialog.open) dialog.showModal()
    } else if (dialog.open) {
      dialog.close()
    }
  }, [recipe])

  function handleDialogClick(event) {
    if (event.target === event.currentTarget) onClose()
  }

  if (!recipe) {
    // Keep the dialog mounted (closed) so the closing animation/native behaviour works cleanly.
    return <dialog ref={dialogRef} onClose={onClose} onClick={handleDialogClick} />
  }

  const handleAdd = async () => {
    setSaving(true)
    await onAddToPlan(dayIndex, mealSlot, recipe.id, Number(plannedServes) || recipe.serves)
    setSaving(false)
  }

  return (
    <dialog ref={dialogRef} onClose={onClose} onClick={handleDialogClick}>
      <div>
        <h2 className="detail-title">{recipe.name}</h2>
        <p className="detail-meta">
          {recipe.cuisine ? `Serves ${recipe.serves}, ${capitalise(recipe.cuisine)}` : `Serves ${recipe.serves}`}
        </p>

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
        </div>

        <h3 className="detail-section-title">Ingredients</h3>
        <ul className="detail-ing-list">
          {recipe.ingredients.map((ing, i) => (
            <li key={i}>{formatIngredient(ing)}</li>
          ))}
        </ul>

        <h3 className="detail-section-title">Method</h3>
        <ol className="detail-method-list">
          {recipe.method.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>

        <h3 className="detail-section-title">Add to this week&rsquo;s plan</h3>
        <div className="plan-picker">
          <div className="plan-picker-row">
            <select value={dayIndex} onChange={(e) => setDayIndex(Number(e.target.value))}>
              {DAY_NAMES.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
            <select value={mealSlot} onChange={(e) => setMealSlot(e.target.value)}>
              {MEAL_SLOTS.map((s) => (
                <option key={s} value={s}>
                  {capitalise(s)}
                </option>
              ))}
            </select>
            <label className="serves-picker">
              <span>Serves</span>
              <input
                type="number"
                min="1"
                step="1"
                value={plannedServes}
                onChange={(e) => setPlannedServes(e.target.value)}
              />
            </label>
          </div>
          <button type="button" className="btn btn-primary" onClick={handleAdd} disabled={saving}>
            {saving ? 'Adding…' : 'Add to plan'}
          </button>

          {recipe.isCustom && (
            <button
              type="button"
              className="btn-danger-text"
              onClick={() => onDeleteRecipe(recipe.id)}
            >
              Remove this recipe
            </button>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </dialog>
  )
}

RecipeDetailModal.propTypes = {
  recipe: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    serves: PropTypes.number,
    cuisine: PropTypes.string,
    mealType: PropTypes.arrayOf(PropTypes.string),
    dietary: PropTypes.arrayOf(PropTypes.string),
    ingredients: PropTypes.arrayOf(PropTypes.object),
    method: PropTypes.arrayOf(PropTypes.string),
    isCustom: PropTypes.bool,
  }),
  onClose: PropTypes.func.isRequired,
  onAddToPlan: PropTypes.func.isRequired,
  onDeleteRecipe: PropTypes.func.isRequired,
}

