import { Router } from "express";
import db from "../setup/db.js";
import { parseCsv, slugify } from "../helpers.js";
import { recipeRowToJson } from "../lib.js";

const router = Router();
const DIETARY_TAGS = ["vegetarian", "vegan", "gluten-free", "dairy-free"];

router.get("/", (req, res) => {
  const rows = db.prepare("SELECT * FROM recipes ORDER BY name ASC").all();
  let recipes = rows.map(recipeRowToJson);

  const dietary = parseCsv(req.query.dietary);
  const mealType = parseCsv(req.query.mealType);
  const query = (req.query.q || "").toLowerCase().trim();

  if (dietary.length) {
    recipes = recipes.filter((recipe) => dietary.every((tag) => recipe.dietary.includes(tag)));
  }
  if (mealType.length) {
    recipes = recipes.filter((recipe) =>
      mealType.some((meal) => (meal === "own" ? recipe.isCustom : recipe.mealType.includes(meal)))
    );
  }
  if (query) {
    recipes = recipes.filter((recipe) => recipe.name.toLowerCase().includes(query));
  }

  res.json(recipes);
});

router.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM recipes WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Recipe not found" });
  res.json(recipeRowToJson(row));
});

router.post("/", (req, res) => {
  const body = req.body || {};
  if (!body.name || !Array.isArray(body.ingredients) || !body.ingredients.length) {
    return res.status(400).json({ error: "A recipe needs at least a name and one ingredient." });
  }
  if (!Array.isArray(body.method) || !body.method.length) {
    return res.status(400).json({ error: "A recipe needs at least one method step." });
  }

  const id = slugify(body.name) + "-" + Date.now().toString(36);
  const dietary = Array.isArray(body.dietary)
    ? body.dietary.filter((tag) => DIETARY_TAGS.includes(tag))
    : [];

  db.prepare(`
    INSERT INTO recipes (id, name, cuisine, meal_types, dietary, tags, serves, ingredients, method, is_custom)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    id,
    body.name,
    body.cuisine || null,
    JSON.stringify(["own"]),
    JSON.stringify(dietary),
    JSON.stringify(Array.isArray(body.tags) ? body.tags : []),
    Number(body.serves) || 2,
    JSON.stringify(body.ingredients),
    JSON.stringify(body.method)
  );

  const row = db.prepare("SELECT * FROM recipes WHERE id = ?").get(id);
  res.status(201).json(recipeRowToJson(row));
});

router.delete("/:id", (req, res) => {
  const row = db.prepare("SELECT is_custom FROM recipes WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Recipe not found" });
  if (!row.is_custom) return res.status(400).json({ error: "Only custom recipes can be deleted." });
  db.prepare("DELETE FROM recipes WHERE id = ?").run(req.params.id);
  res.status(204).end();
});

export default router;
