const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const DB_PATH = path.join(__dirname, "nosh.db");
const SEED_PATH = path.join(__dirname, "recipes.seed.json");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      cuisine TEXT,
      meal_types TEXT NOT NULL DEFAULT '[]',   -- JSON array
      dietary TEXT NOT NULL DEFAULT '[]',       -- JSON array
      tags TEXT NOT NULL DEFAULT '[]',          -- JSON array
      serves INTEGER NOT NULL DEFAULT 2,
      ingredients TEXT NOT NULL DEFAULT '[]',   -- JSON array of {item, quantity, unit, prep}
      method TEXT NOT NULL DEFAULT '[]',        -- JSON array of strings
      is_custom INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS preferences (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      dietary TEXT NOT NULL DEFAULT '[]'        -- JSON array e.g. ["vegetarian","dairy-free"]
    );

    -- One row per (day_of_week, meal_slot). day 0=Mon .. 6=Sun.
    CREATE TABLE IF NOT EXISTS plan_entries (
      day_of_week INTEGER NOT NULL,
      meal_slot TEXT NOT NULL,                  -- breakfast | lunch | dinner
      recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      PRIMARY KEY (day_of_week, meal_slot)
    );

    -- Pantry check-off: ingredient names the user already has, so they can be
    -- ticked off the generated shopping list instead of re-bought. This is the
    -- "baseline plus one" feature: a running pantry the shopping list respects.
    CREATE TABLE IF NOT EXISTS pantry_items (
      item_key TEXT PRIMARY KEY,                -- normalised ingredient name
      have_it INTEGER NOT NULL DEFAULT 1
    );
  `);

  const prefRow = db.prepare("SELECT id FROM preferences WHERE id = 1").get();
  if (!prefRow) {
    db.prepare("INSERT INTO preferences (id, dietary) VALUES (1, '[]')").run();
  }
}

function seedRecipesIfEmpty() {
  const { count } = db.prepare("SELECT COUNT(*) AS count FROM recipes").get();
  if (count > 0) return;

  const raw = fs.readFileSync(SEED_PATH, "utf-8");
  const recipes = JSON.parse(raw);

  const insert = db.prepare(`
    INSERT INTO recipes (id, name, cuisine, meal_types, dietary, tags, serves, ingredients, method, is_custom)
    VALUES (@id, @name, @cuisine, @meal_types, @dietary, @tags, @serves, @ingredients, @method, 0)
  `);

  const insertMany = db.transaction((items) => {
    for (const r of items) {
      insert.run({
        id: r.id,
        name: r.name,
        cuisine: r.cuisine || null,
        meal_types: JSON.stringify(r.mealType || []),
        dietary: JSON.stringify(r.dietary || []),
        tags: JSON.stringify(r.tags || []),
        serves: r.serves || 2,
        ingredients: JSON.stringify(r.ingredients || []),
        method: JSON.stringify(r.method || []),
      });
    }
  });

  insertMany(recipes);
  console.log(`Seeded ${recipes.length} starter recipes from recipes.seed.json`);
}

migrate();
seedRecipesIfEmpty();

module.exports = db;
