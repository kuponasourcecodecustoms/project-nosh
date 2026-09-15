# Nosh — meal planner demo

A working demo built against the Enablis "Project Nosh" candidate brief. It's a small
layered web app: a plain HTML/CSS/JS client talking to a Node/Express API, backed by
SQLite.

## Run it

```bash
npm install
npm start
```

Then open **http://localhost:4000**. The database (`server/nosh.db`) is created and
seeded from `server/recipes.seed.json` the first time you run it — delete that file
to reset to a clean slate.

No build step, no framework tooling — just Node.

## What it covers (the baseline)

1. **Starter or custom recipes** — the 20 recipes from `project-nosh-sample-recipes.json`
   are seeded into SQLite on first run. "Add your own recipe" lets you add more, each
   with ingredients and a method, stored the same way.
2. **Dietary preferences** — vegetarian / vegan / gluten-free / dairy-free chips on the
   Recipes tab. They're saved as a standing preference (`GET/PUT /api/preferences`) and
   immediately narrow the recipe list, so once set they stay set.
3. **Plan across the week** — the "This week" tab shows Monday–Sunday, each with
   breakfast/lunch/dinner slots you can fill from any recipe (starter or custom).
4. **Combined shopping list** — the "Shopping list" tab pulls every ingredient from
   every planned meal and adds up matching ingredients (same name + same unit) into
   one line, e.g. three recipes each using onion becomes a single "onion" line. It
   shows which recipes each line came from.

## Baseline plus one: pantry check-off

The shopping list has a checkbox on each line. Ticking it marks that ingredient as
something the household already has — it's not a "done shopping" tick, it *removes
noise before the shop happens*: ticked items sink to the bottom with a strikethrough,
so what's left is only what you actually still need to buy. It's a small feature but
a direct answer to Nosh's brief: cut the faff, respect a fixed weekly budget, don't
make someone re-read a list to work out what's already in the cupboard.

It's implemented as its own table (`pantry_items`) rather than piggybacking on the
plan, so it persists across weeks — the app slowly learns your regular staples.

## Architecture

```
project-nosh/
├── server/
│   ├── index.js        Express app: all /api routes
│   ├── db.js            SQLite schema + one-time seeding from the JSON file
│   ├── lib.js            Row<->JSON mapping + shopping-list aggregation logic
│   └── recipes.seed.json Copy of the provided starter recipes
├── public/
│   ├── index.html        Single page, three views toggled by JS (no router needed)
│   ├── styles.css         Nosh brand tokens (colour/type from the brand slide)
│   └── app.js             All client logic: fetch calls + DOM rendering, no framework
└── package.json
```

**Client / API split**: the client only ever talks to `/api/*` over `fetch`; there's
no server-rendering of app state, so the same API could sit behind a different client
later without change.

**Storage**: SQLite via `better-sqlite3` (synchronous, no async ceremony for a
single-user local demo, per the brief's "single user, no login" ground rule).

**Shopping list aggregation** (`server/lib.js`): ingredients are grouped by
`(normalised name, unit)`. Quantities are summed when both match. Ingredients with
different units (e.g. one recipe calls for "2 onions", another "200g diced onion")
are deliberately kept as separate lines rather than guess-converted — silently
converting units felt riskier for a shopping list than showing two honest lines.

## Design notes

Colour, type and voice come straight from the brand slide: Nunito throughout
(headings bold, body regular/semibold), Nosh Green as the primary action colour,
Deep Teal for links/selected states, Flame Coral reserved for removal/warning
actions, Leaf used sparingly for recipe tags like "batch-cook". Layout is mobile-first
with a fixed bottom tab bar (thumb-reachable, no horizontal scrolling), since the
brief calls out an audience on older, smaller phones.

## What's deliberately out of scope for a 2–3 hour demo

- No auth/multi-user (per the ground rules).
- No unit conversion in the shopping list (see above).
- No image uploads for custom recipes — text only.
- No offline/PWA support.
