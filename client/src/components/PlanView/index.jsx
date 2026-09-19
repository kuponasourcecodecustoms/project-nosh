import PropTypes from 'prop-types'
import { useEffect } from 'react'
import styles from './styles.module.css'
import PlanDay from '../PlanDay/index.jsx'
import { api } from '../../api.js'
import { usePlan } from '../../hooks/usePlan.js'
import { todayIndex } from '../../util.js'

export default function PlanView({ active, refreshToken, onPlanChanged, onAddSlot }) {
  const { plan, refreshPlan } = usePlan()

  useEffect(() => {
    if (refreshToken > 0) refreshPlan()
  }, [refreshPlan, refreshToken])

  async function handleRemoveSlot(dayIndex, mealSlot) {
    await api.clearPlanSlot(dayIndex, mealSlot)
    refreshPlan()
    onPlanChanged()
  }

  async function handleUpdateServes(dayIndex, mealSlot, recipeId, serves) {
    if (!Number.isInteger(serves) || serves < 1) return
    await api.setPlanSlot(dayIndex, mealSlot, recipeId, serves)
    refreshPlan()
    onPlanChanged()
  }

  async function handleClearPlan() {
    if (!confirm('Clear every meal planned for this week?')) return
    await api.clearPlan()
    refreshPlan()
    onPlanChanged()
  }

  if (!plan) return null

  const today = todayIndex()

  return (
    <section className={`view${active ? ' is-active' : ''}`}>
      <p className="view-lede">Fill in the week as it suits you. Skip meals you don&rsquo;t need to plan for.</p>
      <div className={styles.planDays}>
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
  active: PropTypes.bool.isRequired,
  refreshToken: PropTypes.number.isRequired,
  onPlanChanged: PropTypes.func.isRequired,
  onAddSlot: PropTypes.func.isRequired,
}

