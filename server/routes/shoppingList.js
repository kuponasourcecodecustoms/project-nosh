import { Router } from "express";
import db from "../setup/db.js";
import { buildShoppingList, recipeRowToJson } from "../lib.js";

const router = Router();

router.get("/", (req, res) => {
  const entries = db.prepare("SELECT recipe_id, serves FROM plan_entries").all();
  const recipeIds = [...new Set(entries.map((entry) => entry.recipe_id))];

  if (!recipeIds.length) {
    return res.json({ list: [], recipeCount: 0 });
  }

  const placeholders = recipeIds.map(() => "?").join(",");
  const rows = db.prepare(`SELECT * FROM recipes WHERE id IN (${placeholders})`).all(...recipeIds);
  const recipesById = Object.fromEntries(rows.map((row) => [row.id, recipeRowToJson(row)]));
  const recipes = entries
    .map((entry) => {
      const recipe = recipesById[entry.recipe_id];
      if (!recipe) return null;
      const plannedServes = entry.serves || recipe.serves;
      return { ...recipe, servesMultiplier: plannedServes / recipe.serves };
    })
    .filter(Boolean);

  const pantryRows = db.prepare("SELECT item_key FROM pantry_items WHERE have_it = 1").all();
  const pantrySet = new Set(pantryRows.map((row) => row.item_key));

  const list = buildShoppingList(recipes, pantrySet);
  res.json({ list, recipeCount: recipes.length });
});

export default router;
