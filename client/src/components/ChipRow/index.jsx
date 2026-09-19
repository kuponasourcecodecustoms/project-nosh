import PropTypes from 'prop-types'
import styles from './styles.module.css'

export default function ChipRow({ options, selected, onToggle, ariaLabel }) {
  return (
    <div className={styles.chipRow} role="group" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          className={`${styles.chip}${selected.includes(opt.key) ? ` ${styles.isSelected}` : ''}`}
          onClick={() => onToggle(opt.key)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

ChipRow.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  selected: PropTypes.arrayOf(PropTypes.string).isRequired,
  onToggle: PropTypes.func.isRequired,
  ariaLabel: PropTypes.string.isRequired,
}

