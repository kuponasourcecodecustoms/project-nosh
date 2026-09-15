export default function TopBar({ onAddRecipe }) {
  return (
    <header className="topbar">
      <div className="wordmark" aria-label="Nosh">
        <span className="wordmark-mark">n</span>osh
      </div>
      <button type="button" className="btn btn-ghost" onClick={onAddRecipe}>
        Add your own recipe
      </button>
    </header>
  )
}
