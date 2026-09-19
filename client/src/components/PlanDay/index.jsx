import PropTypes from 'prop-types'
import { useState } from 'react'
import styles from './styles.module.css'
import { MEAL_SLOTS } from '../../constants.js'

export default function PlanDay({ day, isToday, onAddSlot, onRemoveSlot, onUpdateServes }) {
  const [open, setOpen] = useState(isToday)
  const filledCount = MEAL_SLOTS.filter((s) => day.meals[s]).length

  return (
    <div className={`${styles.planDay}${open ? ` ${styles.isOpen}` : ''}`}>
      <button type="button" className={styles.planDayHead} onClick={() => setOpen((o) => !o)}>
        <span className={styles.planDayBar} />
        <span className={styles.planDayName}>{day.dayName}</span>
        {isToday && <span className={styles.todayPill}>Today</span>}
        <span className={styles.planDaySummary}>{filledCount ? `${filledCount} of 3 planned` : 'Nothing planned'}</span>
      </button>
      <div className={styles.planDayBody}>
        {MEAL_SLOTS.map((slot) => (
          <div className={styles.mealSlotRow} key={slot}>
            <span className={styles.mealSlotLabel}>{slot}</span>
            {day.meals[slot] ? (
              <div className={styles.mealSlotFilled}>
                <span className={styles.mealSlotRecipeName}>{day.meals[slot].name}</span>
                <label className={styles.plannedServes}>
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

