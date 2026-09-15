import { capitalise } from '../lib.js'

export default function ShoppingListView({ list, onTogglePantry }) {
  if (!list) return null

  if (!list.recipeCount) {
    return (
      <section className="view is-active">
        <p className="view-lede">
          Everything your planned meals need, added up so you&rsquo;re not buying two of what you need one of.
        </p>
        <p className="empty-state">Nothing planned yet. Add meals to the week and your list will build itself here.</p>
      </section>
    )
  }

  if (!list.list.length) {
    return (
      <section className="view is-active">
        <p className="view-lede">
          Everything your planned meals need, added up so you&rsquo;re not buying two of what you need one of.
        </p>
        <p className="empty-state">Every ingredient for this week is already ticked off. Nice.</p>
      </section>
    )
  }

  return (
    <section className="view is-active">
      <p className="view-lede">
        Everything your planned meals need, added up so you&rsquo;re not buying two of what you need one of.
      </p>

      <ul className="shop-list">
        {list.list.map((item) => {
          const id = 'shop-' + item.item.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          return (
            <li className={'shop-item' + (item.haveIt ? ' is-have' : '')} key={item.item}>
              <input
                type="checkbox"
                id={id}
                checked={item.haveIt}
                onChange={(e) => onTogglePantry(item.item, e.target.checked)}
              />
              <div className="shop-item-main">
                <label htmlFor={id} className="shop-item-name">
                  {capitalise(item.item)}
                </label>
                {item.quantity !== null && (
                  <div className="shop-item-amounts">
                    <span>
                      <small>Recipe amount</small>
                      {item.recipeQuantity}{item.unit ? ` ${item.unit}` : ''}
                    </span>
                    <span className="shop-item-qty">
                      <small>Shopping amount</small>
                      {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                    </span>
                  </div>
                )}
                <div className="shop-item-sources">For: {item.fromRecipes.join(', ')}</div>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
