import { useState } from 'react'
import logo from '../img/Nosh Logo.png'

const TABS = [
  { key: 'recipes', icon: '🍲', label: 'Recipes' },
  { key: 'plan', icon: '📅', label: 'This week' },
  { key: 'shopping', icon: '🧾', label: 'Shopping list' },
]

export default function TabBar({ activeView, onChange, shoppingNeedCount }) {
  const [menuOpen, setMenuOpen] = useState(false)

  function handleChange(view) {
    onChange(view)
    setMenuOpen(false)
  }

  return (
    <nav className={'tabbar' + (menuOpen ? ' is-open' : '')} aria-label="Main sections">
      <img src={logo} alt="Nosh" className="brand-logo mobile-wordmark" />
      <button
        type="button"
        className="menu-toggle"
        aria-expanded={menuOpen}
        aria-controls="main-section-menu"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className="menu-toggle-icon" aria-hidden="true">☰</span>
        Menu
      </button>

      <div className="tab-menu" id="main-section-menu">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={'tab-btn' + (activeView === tab.key ? ' is-active' : '')}
            aria-current={activeView === tab.key ? 'page' : undefined}
            onClick={() => handleChange(tab.key)}
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
      </div>
    </nav>
  )
}
