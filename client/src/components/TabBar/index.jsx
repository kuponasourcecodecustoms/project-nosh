import PropTypes from 'prop-types'
import { useState } from 'react'
import styles from './styles.module.css'
const logo = '/img/NoshLogo.png'

const TABS = [
  { key: 'recipes', icon: '🍲', label: 'Recipes' },
  { key: 'plan', icon: '📅', label: 'This week' },
  { key: 'shopping', icon: '🧾', label: 'Shopping list' },
]

export default function TabBar({ activeView, onChange }) {
  const [menuOpen, setMenuOpen] = useState(false)

  function handleChange(view) {
    onChange(view)
    setMenuOpen(false)
  }

  return (
    <nav className={`${styles.tabbar}${menuOpen ? ` ${styles.isOpen}` : ''}`} aria-label="Main sections">
      <img src={logo} alt="Nosh" className={`${styles.brandLogo} ${styles.mobileWordmark}`} />
      <button
        type="button"
        className={styles.menuToggle}
        aria-expanded={menuOpen}
        aria-controls="main-section-menu"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className={styles.menuToggleIcon} aria-hidden="true">☰</span>
        Menu
      </button>
      <div className={styles.tabMenu} id="main-section-menu">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`${styles.tabBtn}${activeView === tab.key ? ` ${styles.isActive}` : ''}`}
            aria-current={activeView === tab.key ? 'page' : undefined}
            onClick={() => handleChange(tab.key)}
          >
            <span className={styles.tabIcon} aria-hidden="true">
              {tab.icon}
            </span>
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  )
}

TabBar.propTypes = {
  activeView: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
}

