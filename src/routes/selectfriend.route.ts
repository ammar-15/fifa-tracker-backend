import express from "express";
import { requireUser } from "../middleware/requireUser.js";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";

const selectfriendRouter = express.Router();

selectfriendRouter.use(requireUser);

selectfriendRouter.get("/", async (req, res) => {
  try {
    const { data: friends, error } = await req.supabase
      .from("friends")
      .select("friend_user_id")
      .eq("user_id", req.user.id)
      .eq("status", "accepted");

    if (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    const friendIds = (friends ?? []).map((f) => f.friend_user_id);
    if (friendIds.length === 0) {
      res.json({ friends: [] });
      return;
    }

    const { data: profiles, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("username, id")
      .in("id", friendIds);

    if (profileError) {
      console.error("Error fetching profiles:", profileError);
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    const friendUsernames = (profiles ?? []).map((p) => p.username);

    res.json({ friends: friendUsernames });
  } catch (error) {
    console.error("Error fetching friends:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default selectfriendRouter;
