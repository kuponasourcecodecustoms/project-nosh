import { Router } from "express";
import db from "../setup/db.js";
import { normaliseKey } from "../lib.js";

const router = Router();

router.get("/", (req, res) => {
  const rows = db.prepare("SELECT item_key FROM pantry_items WHERE have_it = 1").all();
  res.json({ items: rows.map((row) => row.item_key) });
});

router.put("/:itemKey", (req, res) => {
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

export default router;
