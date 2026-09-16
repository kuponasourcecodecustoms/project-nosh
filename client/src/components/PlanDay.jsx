import PropTypes from 'prop-types'
import { useState } from 'react'
import { MEAL_SLOTS } from '../constants.js'

export default function PlanDay({ day, isToday, onAddSlot, onRemoveSlot, onUpdateServes }) {
  const [open, setOpen] = useState(isToday)
  const filledCount = MEAL_SLOTS.filter((s) => day.meals[s]).length

  return (
    <div className={'plan-day' + (open ? ' is-open' : '')}>
      <button type="button" className="plan-day-head" onClick={() => setOpen((o) => !o)}>
        <span className="plan-day-bar" />
        <span className="plan-day-name">{day.dayName}</span>
        {isToday && <span className="today-pill">Today</span>}
        <span className="plan-day-summary">{filledCount ? `${filledCount} of 3 planned` : 'Nothing planned'}</span>
      </button>

      <div className="plan-day-body">
        {MEAL_SLOTS.map((slot) => (
          <div className="meal-slot-row" key={slot}>
            <span className="meal-slot-label">{slot}</span>
            {day.meals[slot] ? (
              <div className="meal-slot-filled">
                <span className="meal-slot-recipe-name">{day.meals[slot].name}</span>
                <label className="planned-serves">
                  <span>Serves</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    defaultValue={day.meals[slot].plannedServes || day.meals[slot].serves}
                    onBlur={(e) => onUpdateServes(day.dayIndex, slot, day.meals[slot].id, Number(e.target.value))}
                  />
                </label>
                <button type="button" className="btn-danger-text" onClick={() => onRemoveSlot(day.dayIndex, slot)}>
                  Remove
                </button>
              </div>
            ) : (
              <button type="button" className="link-btn" onClick={() => onAddSlot(day.dayIndex, slot)}>
                + Add a recipe
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

PlanDay.propTypes = {
  day: PropTypes.shape({
    dayIndex: PropTypes.number.isRequired,
    dayName: PropTypes.string.isRequired,
    meals: PropTypes.objectOf(
      PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string,
        serves: PropTypes.number,
        plannedServes: PropTypes.number,
      })
    ).isRequired,
  }).isRequired,
  isToday: PropTypes.bool.isRequired,
  onAddSlot: PropTypes.func.isRequired,
  onRemoveSlot: PropTypes.func.isRequired,
  onUpdateServes: PropTypes.func.isRequired,
}

