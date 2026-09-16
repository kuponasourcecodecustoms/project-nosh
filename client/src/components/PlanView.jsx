import PropTypes from 'prop-types'
import PlanDay from './PlanDay.jsx'
import { api } from '../api.js'
import { usePlan } from '../hooks/usePlan.js'
import { todayIndex } from '../util.js'

export default function PlanView({ onAddSlot }) {
  const { plan, refreshPlan } = usePlan()

  async function handleRemoveSlot(dayIndex, mealSlot) {
    await api.clearPlanSlot(dayIndex, mealSlot)
    refreshPlan()
  }

  async function handleUpdateServes(dayIndex, mealSlot, recipeId, serves) {
    if (!Number.isInteger(serves) || serves < 1) return
    await api.setPlanSlot(dayIndex, mealSlot, recipeId, serves)
    refreshPlan()
  }

  async function handleClearPlan() {
    if (!confirm('Clear every meal planned for this week?')) return
    await api.clearPlan()
    refreshPlan()
  }

  if (!plan) return null

  const today = todayIndex()

  return (
    <section className="view is-active">
      <p className="view-lede">Fill in the week as it suits you. Skip meals you don&rsquo;t need to plan for.</p>

      <div className="plan-days">
        {plan.week.map((day) => (
          <PlanDay
            key={day.dayIndex}
            day={day}
            isToday={day.dayIndex === today}
            onAddSlot={onAddSlot}
            onRemoveSlot={handleRemoveSlot}
            onUpdateServes={handleUpdateServes}
          />
        ))}
      </div>

      <button type="button" className="link-btn link-btn-muted" onClick={handleClearPlan}>
        Clear the whole week
      </button>
    </section>
  )
}

PlanView.propTypes = {
  onAddSlot: PropTypes.func.isRequired,
}

