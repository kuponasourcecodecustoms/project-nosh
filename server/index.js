const path = require("path");
const express = require("express");
const db = require("./db");
const { DAY_NAMES, MEAL_SLOTS, recipeRowToJson, normaliseKey, buildShoppingList } = require("./lib");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const DIETARY_TAGS = ["vegetarian", "vegan", "gluten-free", "dairy-free"];

// ---------- Recipes ----------

// GET /api/recipes?dietary=vegetarian,dairy-free&mealType=dinner&q=chicken
app.get("/api/recipes", (req, res) => {
  const rows = db.prepare("SELECT * FROM recipes ORDER BY name ASC").all();
  let recipes = rows.map(recipeRowToJson);

  const dietary = parseCsv(req.query.dietary);
  const mealType = parseCsv(req.query.mealType);
  const q = (req.query.q || "").toLowerCase().trim();

  if (dietary.length) {
    recipes = recipes.filter((r) => dietary.every((d) => r.dietary.includes(d)));
  }
  if (mealType.length) {
    recipes = recipes.filter((r) =>
      mealType.some((m) => (m === "own" ? r.isCustom : r.mealType.includes(m)))
    );
  }
  if (q) {
    recipes = recipes.filter((r) => r.name.toLowerCase().includes(q));
  }

  res.json(recipes);
});

app.get("/api/recipes/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM recipes WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Recipe not found" });
  res.json(recipeRowToJson(row));
});

// POST /api/recipes - add a custom recipe
app.post("/api/recipes", (req, res) => {
  const b = req.body || {};
  if (!b.name || !Array.isArray(b.ingredients) || !b.ingredients.length) {
    return res.status(400).json({ error: "A recipe needs at least a name and one ingredient." });
  }
  if (!Array.isArray(b.method) || !b.method.length) {
    return res.status(400).json({ error: "A recipe needs at least one method step." });
  }

  const id = slugify(b.name) + "-" + Date.now().toString(36);
  const dietary = Array.isArray(b.dietary) ? b.dietary.filter((d) => DIETARY_TAGS.includes(d)) : [];

  db.prepare(`
    INSERT INTO recipes (id, name, cuisine, meal_types, dietary, tags, serves, ingredients, method, is_custom)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    id,
    b.name,
    b.cuisine || null,
    JSON.stringify(['own']),
    JSON.stringify(dietary),
    JSON.stringify(Array.isArray(b.tags) ? b.tags : []),
    Number(b.serves) || 2,
    JSON.stringify(b.ingredients),
    JSON.stringify(b.method)
  );

  const row = db.prepare("SELECT * FROM recipes WHERE id = ?").get(id);
  res.status(201).json(recipeRowToJson(row));
});

app.delete("/api/recipes/:id", (req, res) => {
  const row = db.prepare("SELECT is_custom FROM recipes WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Recipe not found" });
  if (!row.is_custom) return res.status(400).json({ error: "Only custom recipes can be deleted." });
  db.prepare("DELETE FROM recipes WHERE id = ?").run(req.params.id);
  res.status(204).end();
});

// ---------- Dietary preferences ----------

app.get("/api/preferences", (req, res) => {
  const row = db.prepare("SELECT dietary FROM preferences WHERE id = 1").get();
  res.json({ dietary: JSON.parse(row.dietary) });
});

app.put("/api/preferences", (req, res) => {
  const dietary = Array.isArray(req.body?.dietary)
    ? req.body.dietary.filter((d) => DIETARY_TAGS.includes(d))
    : [];
  db.prepare("UPDATE preferences SET dietary = ? WHERE id = 1").run(JSON.stringify(dietary));
  res.json({ dietary });
});

// ---------- Weekly plan ----------

app.get("/api/plan", (req, res) => {
  const entries = db.prepare("SELECT day_of_week, meal_slot, recipe_id, serves FROM plan_entries").all();
  const recipeIds = [...new Set(entries.map((e) => e.recipe_id))];
  const recipesById = {};
  if (recipeIds.length) {
    const placeholders = recipeIds.map(() => "?").join(",");
    const rows = db.prepare(`SELECT * FROM recipes WHERE id IN (${placeholders})`).all(...recipeIds);
    rows.forEach((r) => (recipesById[r.id] = recipeRowToJson(r)));
  }

  const week = DAY_NAMES.map((dayName, dayIndex) => {
    const meals = {};
    MEAL_SLOTS.forEach((slot) => (meals[slot] = null));
    entries
      .filter((e) => e.day_of_week === dayIndex)
      .forEach((e) => {
        const recipe = recipesById[e.recipe_id];
        meals[e.meal_slot] = recipe ? { ...recipe, plannedServes: e.serves || recipe.serves } : null;
      });
    return { dayIndex, dayName, meals };
  });

  res.json({ week });
});

// PUT /api/plan/:dayIndex/:mealSlot  { recipeId, serves }
app.put("/api/plan/:dayIndex/:mealSlot", (req, res) => {
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

app.delete("/api/plan/:dayIndex/:mealSlot", (req, res) => {
  const dayIndex = Number(req.params.dayIndex);
  const mealSlot = req.params.mealSlot;
  db.prepare("DELETE FROM plan_entries WHERE day_of_week = ? AND meal_slot = ?").run(dayIndex, mealSlot);
  res.status(204).end();
});

app.delete("/api/plan", (req, res) => {
  db.prepare("DELETE FROM plan_entries").run();
  res.status(204).end();
});

// ---------- Pantry (baseline+one feature) ----------

app.get("/api/pantry", (req, res) => {
  const rows = db.prepare("SELECT item_key FROM pantry_items WHERE have_it = 1").all();
  res.json({ items: rows.map((r) => r.item_key) });
});

app.put("/api/pantry/:itemKey", (req, res) => {
  // Express already decodes route param segments, so itemKey arrives as plain text.
  const key = normaliseKey(req.params.itemKey);
  const haveIt = req.body?.haveIt ? 1 : 0;
  if (haveIt) {
    db.prepare(`
      INSERT INTO pantry_items (item_key, have_it) VALUES (?, 1)
      ON CONFLICT(item_key) DO UPDATE SET have_it = 1
    `).run(key);
  } else {
    db.prepare("DELETE FROM pantry_items WHERE item_key = ?").run(key);
  }
  res.status(204).end();
});

// ---------- Shopping list ----------

app.get("/api/shopping-list", (req, res) => {
  const entries = db.prepare("SELECT recipe_id, serves FROM plan_entries").all();
  const recipeIds = [...new Set(entries.map((e) => e.recipe_id))];

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
  const pantrySet = new Set(pantryRows.map((r) => r.item_key));

  const list = buildShoppingList(recipes, pantrySet);
  res.json({ list, recipeCount: recipes.length });
});

// ---------- helpers ----------

function parseCsv(v) {
  if (!v) return [];
  return String(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// SPA fallback for any non-API route (serves the built React app in production)
app.get(/^(?!\/api\/).*/, (req, res) => {
  const indexPath = path.join(__dirname, "public", "index.html");
  if (!require("fs").existsSync(indexPath)) {
    return res
      .status(200)
      .send(
        "Nosh API is running on this port, but the client hasn't been built yet.\n" +
          "Run `npm run build` (or use `npm run dev` for hot-reloading development), " +
          "then reload this page."
      );
  }
  res.sendFile(indexPath);
});

const server = app.listen(PORT, () => {
  console.log(`Nosh server running at http://localhost:${PORT}`);
});

function shutdown(signal) {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
