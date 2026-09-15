import { useEffect, useRef, useState } from 'react'
import { DAY_NAMES, MEAL_SLOTS, capitalise, dietaryLabel, formatIngredient } from '../lib.js'

export default function RecipeDetailModal({ recipe, onClose, onAddToPlan, onDeleteRecipe }) {
  const dialogRef = useRef(null)
  const [dayIndex, setDayIndex] = useState(0)
  const [mealSlot, setMealSlot] = useState('dinner')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!recipe) return
    if (recipe.mealType.includes('dinner')) setMealSlot('dinner')
    else if (recipe.mealType.includes('lunch')) setMealSlot('lunch')
    else if (recipe.mealType.includes('breakfast')) setMealSlot('breakfast')
    else setMealSlot('dinner')
    setDayIndex(0)
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

  if (!recipe) {
    // Keep the dialog mounted (closed) so the closing animation/native behaviour works cleanly.
    return <dialog ref={dialogRef} onClose={onClose} />
  }

  const handleAdd = async () => {
    setSaving(true)
    await onAddToPlan(dayIndex, mealSlot, recipe.id)
    setSaving(false)
  }

  return (
    <dialog ref={dialogRef} onClose={onClose}>
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
