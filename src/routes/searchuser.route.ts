import express from "express";
import { requireUser } from "../middleware/requireUser.js";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";

const searchUserRouter = express.Router();

searchUserRouter.use(requireUser);

searchUserRouter.get("/", async (req, res): Promise<void> => {
  const { q } = req.query;

  if (!q || typeof q !== "string") {
    res.status(400).json({ error: "Missing search query" });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, username, email")
    .or(`username.ilike.%${q}%,email.ilike.%${q}%`)
    .limit(10);

  if (error) {
    res.status(500).json({ error: "Failed to search users" });
    return;
  }

  const result = (data ?? []).map((user) => ({
    id: user.id,
    username: user.username,
    email: user.email,
  }));

  res.json(result);
});

export default searchUserRouter;
