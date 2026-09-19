import PropTypes from 'prop-types'
import { useEffect, useRef, useState } from 'react'
import styles from './styles.module.css'
import { DAY_NAMES, MEAL_SLOTS } from '../../constants.js'
import { capitalise, dietaryLabel, formatIngredient } from '../../util.js'

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
    return <dialog className={styles.modal} ref={dialogRef} onClose={onClose} onClick={handleDialogClick} />
  }

  const handleAdd = async () => {
    setSaving(true)
    await onAddToPlan(dayIndex, mealSlot, recipe.id, Number(plannedServes) || recipe.serves)
    setSaving(false)
  }

  return (
    <dialog className={styles.modal} ref={dialogRef} onClose={onClose} onClick={handleDialogClick}>
      <div>
        <h2 className={styles.detailTitle}>{recipe.name}</h2>
        <p className={styles.detailMeta}>
          {recipe.cuisine ? `Serves ${recipe.serves}, ${capitalise(recipe.cuisine)}` : `Serves ${recipe.serves}`}
        </p>
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
        </div>
        <h3 className={styles.detailSectionTitle}>Ingredients</h3>
        <ul className={styles.detailIngList}>
          {recipe.ingredients.map((ing, i) => (
            <li key={i}>{formatIngredient(ing)}</li>
          ))}
        </ul>
        <h3 className={styles.detailSectionTitle}>Method</h3>
        <ol className={styles.detailMethodList}>
          {recipe.method.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
        <h3 className={styles.detailSectionTitle}>Add to this week&rsquo;s plan</h3>
        <div className={styles.planPicker}>
          <div className={styles.planPickerRow}>
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
            <label className={styles.servesPicker}>
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
        <div className={styles.modalActions}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn btn-primary" onClick={handleAdd} disabled={saving}>
            {saving ? 'Adding…' : 'Add to plan'}
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

