import { Router } from "express";
import db from "../setup/db.js";
import { DAY_NAMES, MEAL_SLOTS, recipeRowToJson } from "../lib.js";

const router = Router();

router.get("/", (req, res) => {
  const entries = db.prepare("SELECT day_of_week, meal_slot, recipe_id, serves FROM plan_entries").all();
  const recipeIds = [...new Set(entries.map((entry) => entry.recipe_id))];
  const recipesById = {};
  if (recipeIds.length) {
    const placeholders = recipeIds.map(() => "?").join(",");
    const rows = db.prepare(`SELECT * FROM recipes WHERE id IN (${placeholders})`).all(...recipeIds);
    rows.forEach((row) => (recipesById[row.id] = recipeRowToJson(row)));
  }

  const week = DAY_NAMES.map((dayName, dayIndex) => {
    const meals = {};
    MEAL_SLOTS.forEach((slot) => (meals[slot] = null));
    entries
      .filter((entry) => entry.day_of_week === dayIndex)
      .forEach((entry) => {
        const recipe = recipesById[entry.recipe_id];
        meals[entry.meal_slot] = recipe
          ? { ...recipe, plannedServes: entry.serves || recipe.serves }
          : null;
      });
    return { dayIndex, dayName, meals };
  });

  res.json({ week });
});

router.put("/:dayIndex/:mealSlot", (req, res) => {
  const dayIndex = Number(req.params.dayIndex);
  const mealSlot = req.params.mealSlot;
  const { recipeId, serves } = req.body || {};

  if (!(dayIndex >= 0 && dayIndex <= 6)) return res.status(400).json({ error: "Invalid day." });
  if (!MEAL_SLOTS.includes(mealSlot)) return res.status(400).json({ error: "Invalid meal slot." });
  const recipe = db.prepare("SELECT id, serves AS recipe_serves FROM recipes WHERE id = ?").get(recipeId);
  if (!recipe) return res.status(404).json({ error: "Recipe not found." });
  const plannedServes = serves === undefined ? recipe.recipe_serves : Number(serves);
  if (!Number.isInteger(plannedServes) || plannedServes < 1) {
    return res.status(400).json({ error: "Serves must be a whole number of at least 1." });
  }

  db.prepare(`
    INSERT INTO plan_entries (day_of_week, meal_slot, recipe_id, serves) VALUES (?, ?, ?, ?)
    ON CONFLICT(day_of_week, meal_slot) DO UPDATE SET recipe_id = excluded.recipe_id, serves = excluded.serves
  `).run(dayIndex, mealSlot, recipeId, plannedServes);

  res.status(204).end();
});

router.delete("/:dayIndex/:mealSlot", (req, res) => {
  const dayIndex = Number(req.params.dayIndex);
  const mealSlot = req.params.mealSlot;
  db.prepare("DELETE FROM plan_entries WHERE day_of_week = ? AND meal_slot = ?").run(dayIndex, mealSlot);
  res.status(204).end();
});

router.delete("/", (req, res) => {
  db.prepare("DELETE FROM plan_entries").run();
  res.status(204).end();
});

export default router;
