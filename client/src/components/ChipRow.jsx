export default function ChipRow({ options, selected, onToggle, ariaLabel }) {
  return (
    <div className="chip-row" role="group" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          className={'chip' + (selected.includes(opt.key) ? ' is-selected' : '')}
          onClick={() => onToggle(opt.key)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
