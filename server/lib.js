const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEAL_SLOTS = ["breakfast", "lunch", "dinner"];

function recipeRowToJson(row) {
  return {
    id: row.id,
    name: row.name,
    cuisine: row.cuisine,
    mealType: JSON.parse(row.meal_types),
    dietary: JSON.parse(row.dietary),
    tags: JSON.parse(row.tags),
    serves: row.serves,
    ingredients: JSON.parse(row.ingredients),
    method: JSON.parse(row.method),
    isCustom: !!row.is_custom,
  };
}

// Normalise an ingredient name into a key we can group by, so e.g.
// "Onion" and "onion, chopped" still get summed under one shopping-list line.
function normaliseKey(name) {
  return name.trim().toLowerCase();
}

// Units that are safe to sum directly because they are already consistent
// (we don't do unit conversion, e.g. g<->kg, on purpose - kept simple & honest
// for a demo. Mixed/incompatible units are listed as separate lines instead).
function unitKey(unit) {
  return unit === null || unit === undefined ? "" : String(unit).toLowerCase();
}

/**
 * Combine ingredients from a list of recipe objects (each with a `servesMultiplier`
 * already applied, or 1 by default) into a single shopping list, grouped by
 * ingredient + unit so amounts from several recipes are added together sensibly.
 * Ingredients with no quantity/unit (e.g. "salt and pepper") are still listed,
 * just without a summed amount.
 */
function buildShoppingList(plannedRecipes, pantryHaveSet) {
  const groups = new Map(); // key: `${nameKey}::${unitKey}` -> { item, unit, quantity, sources:Set, haveIt }

  for (const recipe of plannedRecipes) {
    const multiplier = recipe.servesMultiplier || 1;
    for (const ing of recipe.ingredients) {
      const nameKey = normaliseKey(ing.item);
      const uKey = unitKey(ing.unit);
      const groupKey = `${nameKey}::${uKey}`;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          item: ing.item,
          unit: ing.unit || null,
          recipeQuantity: 0,
          hasRecipeQuantity: false,
          quantity: 0,
          hasQuantity: false,
          sources: new Set(),
        });
      }
      const g = groups.get(groupKey);
      g.sources.add(recipe.name);

      if (typeof ing.quantity === "number") {
        g.recipeQuantity += ing.quantity;
        g.hasRecipeQuantity = true;
        g.quantity += ing.quantity * multiplier;
        g.hasQuantity = true;
      }
    }
  }

  const list = Array.from(groups.values()).map((g) => {
    const key = normaliseKey(g.item);
    return {
      item: g.item,
      unit: g.unit,
      recipeQuantity: g.hasRecipeQuantity ? roundQty(g.recipeQuantity) : null,
      quantity: g.hasQuantity ? roundQty(g.quantity) : null,
      fromRecipes: Array.from(g.sources),
      haveIt: pantryHaveSet.has(key),
    };
  });

  // Sort: still-needed items first, alphabetically; already-have items last.
  list.sort((a, b) => {
    if (a.haveIt !== b.haveIt) return a.haveIt ? 1 : -1;
    return a.item.localeCompare(b.item);
  });

  return list;
}

function roundQty(n) {
  // Keep up to 2 decimal places, trimming trailing zeros.
  return Math.round(n * 100) / 100;
}

export {
  DAY_NAMES,
  MEAL_SLOTS,
  recipeRowToJson,
  normaliseKey,
  buildShoppingList,
};
