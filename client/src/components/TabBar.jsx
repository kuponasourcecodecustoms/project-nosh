const TABS = [
  { key: 'recipes', icon: '🍲', label: 'Recipes' },
  { key: 'plan', icon: '📅', label: 'This week' },
  { key: 'shopping', icon: '🧾', label: 'Shopping list' },
]

export default function TabBar({ activeView, onChange, shoppingNeedCount }) {
  return (
    <nav className="tabbar" aria-label="Main sections">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={'tab-btn' + (activeView === tab.key ? ' is-active' : '')}
          onClick={() => onChange(tab.key)}
        >
          <span className="tab-icon" aria-hidden="true">
            {tab.icon}
          </span>
          {tab.label}
          {tab.key === 'shopping' && shoppingNeedCount > 0 && (
            <span className="tab-count">{shoppingNeedCount}</span>
          )}
        </button>
      ))}
    </nav>
  )
}
