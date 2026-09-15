import PlanDay from './PlanDay.jsx'
import { todayIndex } from '../lib.js'

export default function PlanView({ plan, onAddSlot, onRemoveSlot, onUpdateServes, onClearPlan }) {
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
            onRemoveSlot={onRemoveSlot}
            onUpdateServes={onUpdateServes}
          />
        ))}
      </div>

      <button type="button" className="link-btn link-btn-muted" onClick={onClearPlan}>
        Clear the whole week
      </button>
    </section>
  )
}
