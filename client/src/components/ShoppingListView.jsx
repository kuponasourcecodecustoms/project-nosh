import PropTypes from 'prop-types'
import { useState } from 'react'
import { capitalise } from '../util.js'

export default function ShoppingListView({ list, onTogglePantry }) {
  const [sortOrder, setSortOrder] = useState('default')

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

  const sortedItems = [...list.list].sort((a, b) => {
    if (sortOrder === 'default') return 0
    const comparison = a.item.localeCompare(b.item)
    return sortOrder === 'za' ? -comparison : comparison
  })

  return (
    <section className="view is-active">
      <p className="view-lede">
        Everything your planned meals need, added up so you&rsquo;re not buying two of what you need one of.
      </p>

      <div className="view-sort-row">
        <label htmlFor="shopping-sort">Sort by:</label>
        <select id="shopping-sort" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="default">Default</option>
          <option value="az">Ingredient (A-Z)</option>
          <option value="za">Ingredient (Z-A)</option>
        </select>
      </div>

      <ul className="shop-list">
        {sortedItems.map((item) => {
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

ShoppingListView.propTypes = {
  list: PropTypes.shape({
    recipeCount: PropTypes.number,
    list: PropTypes.arrayOf(
      PropTypes.shape({
        item: PropTypes.string.isRequired,
        haveIt: PropTypes.bool.isRequired,
        quantity: PropTypes.number,
        unit: PropTypes.string,
        recipeQuantity: PropTypes.number,
        fromRecipes: PropTypes.arrayOf(PropTypes.string).isRequired,
      })
    ),
  }),
  onTogglePantry: PropTypes.func.isRequired,
}

