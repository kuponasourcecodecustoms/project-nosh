import { useEffect, useRef, useState } from 'react'
import ChipRow from './ChipRow.jsx'
import { DIETARY_TAGS, MEAL_TYPE_OPTIONS } from '../lib.js'

const BLANK_INGREDIENT = { item: '', quantity: '', unit: '' }

export default function RecipeFormModal({ open, onClose, onSave }) {
  const dialogRef = useRef(null)
  const [name, setName] = useState('')
  const [serves, setServes] = useState(2)
  const [cuisine, setCuisine] = useState('')
  const [mealType, setMealType] = useState([])
  const [dietary, setDietary] = useState([])
  const [ingredients, setIngredients] = useState([{ ...BLANK_INGREDIENT }, { ...BLANK_INGREDIENT }])
  const [method, setMethod] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open) {
      resetForm()
      if (!dialog.open) dialog.showModal()
    } else if (dialog.open) {
      dialog.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function resetForm() {
    setName('')
    setServes(2)
    setCuisine('')
    setMealType([])
    setDietary([])
    setIngredients([{ ...BLANK_INGREDIENT }, { ...BLANK_INGREDIENT }])
    setMethod('')
    setError('')
  }

  function toggleMealType(key) {
    setMealType((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }
  function toggleDietary(key) {
    setDietary((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }

  function updateIngredient(index, field, value) {
    setIngredients((prev) => prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing)))
  }
  function addIngredientRow() {
    setIngredients((prev) => [...prev, { ...BLANK_INGREDIENT }])
  }
  function removeIngredientRow(index) {
    setIngredients((prev) => prev.filter((_, i) => i !== index))
  }

  function handleDialogClick(event) {
    if (event.target === event.currentTarget) onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const cleanIngredients = ingredients
      .map((ing) => ({
        item: ing.item.trim(),
        quantity: ing.quantity === '' ? null : Number(ing.quantity),
        unit: ing.unit.trim() === '' ? null : ing.unit.trim(),
      }))
      .filter((ing) => ing.item)

    const methodLines = method
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    if (!name.trim() || !cleanIngredients.length || !methodLines.length) {
      setError('Please add a name, at least one ingredient, and at least one method step.')
      return
    }

    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        serves: Number(serves) || 2,
        cuisine: cuisine.trim(),
        mealType,
        dietary,
        ingredients: cleanIngredients,
        method: methodLines,
      })
    } catch (err) {
      setError(err.message)
      setSaving(false)
      return
    }
    setSaving(false)
  }

  return (
    <dialog ref={dialogRef} onClose={onClose} onClick={handleDialogClick}>
      <form onSubmit={handleSubmit}>
        <h2>Add your own recipe</h2>

        <label className="field">
          <span>Recipe name</span>
          <input
            type="text"
            required
            placeholder="e.g. Nan's leek and potato soup"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <div className="field-grid">
          <label className="field">
            <span>Serves</span>
            <input type="number" min="1" required value={serves} onChange={(e) => setServes(e.target.value)} />
          </label>
          <label className="field">
            <span>Cuisine (optional)</span>
            <input type="text" placeholder="e.g. british" value={cuisine} onChange={(e) => setCuisine(e.target.value)} />
          </label>
        </div>

        <fieldset className="field">
          <legend>Meal type</legend>
          <ChipRow options={MEAL_TYPE_OPTIONS} selected={mealType} onToggle={toggleMealType} ariaLabel="Meal type" />
        </fieldset>

        <fieldset className="field">
          <legend>Dietary</legend>
          <ChipRow options={DIETARY_TAGS} selected={dietary} onToggle={toggleDietary} ariaLabel="Dietary" />
        </fieldset>

        <div className="field">
          <span className="field-label-block">Ingredients</span>
          <div className="ingredient-rows">
            {ingredients.map((ing, i) => (
              <div className="ingredient-row" key={i}>
                <input
                  type="text"
                  placeholder="Ingredient (e.g. onion)"
                  value={ing.item}
                  onChange={(e) => updateIngredient(i, 'item', e.target.value)}
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Qty"
                  value={ing.quantity}
                  onChange={(e) => updateIngredient(i, 'quantity', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Unit (g, tbsp…)"
                  value={ing.unit}
                  onChange={(e) => updateIngredient(i, 'unit', e.target.value)}
                />
                <button
                  type="button"
                  className="btn-danger-text"
                  aria-label="Remove ingredient"
                  onClick={() => removeIngredientRow(i)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="link-btn" onClick={addIngredientRow}>
            + Add another ingredient
          </button>
        </div>

        <label className="field">
          <span>Method</span>
          <textarea
            rows={5}
            required
            placeholder={'One step per line, e.g.\nChop the leeks and potatoes.\nSimmer in stock for 20 minutes.\nBlend until smooth.'}
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save recipe'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
