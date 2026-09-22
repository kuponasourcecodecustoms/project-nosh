import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import db from "./setup/db.js";
import recipesRouter from "./routes/recipes.js";
import preferencesRouter from "./routes/preferences.js";
import planRouter from "./routes/plan.js";
import pantryRouter from "./routes/pantry.js";
import shoppingListRouter from "./routes/shoppingList.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/recipes", recipesRouter);
app.use("/api/preferences", preferencesRouter);
app.use("/api/plan", planRouter);
app.use("/api/pantry", pantryRouter);
app.use("/api/shopping-list", shoppingListRouter);

// SPA fallback for any non-API route (serves the built React app in production)
app.get(/^(?!\/api\/).*/, (req, res) => {
  const indexPath = path.join(__dirname, "public", "index.html");
  if (!fs.existsSync(indexPath)) {
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

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
