import { Router } from "express";
import db from "../setup/db.js";

const router = Router();
const DIETARY_TAGS = ["vegetarian", "vegan", "gluten-free", "dairy-free"];

router.get("/", (req, res) => {
  const row = db.prepare("SELECT dietary FROM preferences WHERE id = 1").get();
  res.json({ dietary: JSON.parse(row.dietary) });
});

router.put("/", (req, res) => {
  const dietary = Array.isArray(req.body?.dietary)
    ? req.body.dietary.filter((tag) => DIETARY_TAGS.includes(tag))
    : [];
  db.prepare("UPDATE preferences SET dietary = ? WHERE id = 1").run(JSON.stringify(dietary));
  res.json({ dietary });
});

export default router;
