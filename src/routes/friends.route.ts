import express from "express";
import { requireUser } from "../middleware/requireUser.js";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";

const friendRouter = express.Router();

friendRouter.use(requireUser);

friendRouter.get("/", async (req, res): Promise<void> => {
  try {
    const { data: accepted, error: acceptedError } = await req.supabase
      .from("friends")
      .select("friend_user_id")
      .eq("user_id", req.user.id)
      .eq("status", "accepted");

    const { data: requests, error: requestsError } = await req.supabase
      .from("friends")
      .select("friend_user_id")
      .eq("user_id", req.user.id)
      .eq("status", "pending");

    if (acceptedError || requestsError) {
      console.error("friends fetch error:", acceptedError || requestsError);
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    const friendIds = (accepted ?? []).map((f) => f.friend_user_id);
    const requestIds = (requests ?? []).map((f) => f.friend_user_id);

    const { data: profiles, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, username, email")
      .in("id", [...friendIds, ...requestIds]);

    if (profileError) {
      console.error("profile lookup error:", profileError);
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    const profileById = new Map(
      (profiles ?? []).map((p) => [p.id, p])
    );

    const { data: meProfile } = await req.supabase
      .from("profiles")
      .select("username")
      .eq("id", req.user.id)
      .maybeSingle();

    const friends = friendIds
      .map((id) => profileById.get(id))
      .filter(Boolean)
      .map((p) => ({ username: p?.username, email: p?.email }));

    const pending = requestIds
      .map((id) => profileById.get(id))
      .filter(Boolean)
      .map((p) => ({
        from: p?.username,
        to: meProfile?.username ?? null,
        username: p?.username,
        email: p?.email,
      }));

    res.json({ friends, requests: pending });
  } catch (error) {
    console.error("GET /friends failed:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

friendRouter.post("/request", async (req, res): Promise<void> => {
  try {
    const { to } = req.body as { to?: string };

    if (!to) {
      res.status(400).json({ error: "Missing fields" });
      return;
    }

    const { data: target, error: targetError } = await supabaseAdmin
      .from("profiles")
      .select("id, username, email")
      .or(`username.eq.${to},email.eq.${to}`)
      .maybeSingle();

    if (targetError || !target) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const { data: exists } = await supabaseAdmin
      .from("friends")
      .select("id")
      .eq("user_id", target.id)
      .eq("friend_user_id", req.user.id)
      .maybeSingle();

    if (exists) {
      res.status(400).json({ error: "Already sent" });
      return;
    }

    const { error } = await supabaseAdmin
      .from("friends")
      .insert({
        user_id: target.id,
        friend_user_id: req.user.id,
        status: "pending",
      });

    if (error) {
      console.error("request insert error:", error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    res.json({ message: "Friend request sent" });
  } catch (error) {
    console.error("POST /friends/request failed:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

friendRouter.post("/accept", async (req, res): Promise<void> => {
  const { email, username } = req.body as { email?: string; username?: string };

  if (!email && !username) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }

  const { data: fromUser, error: fromError } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .or(
      email ? `email.eq.${email}` : `username.eq.${username}`
    )
    .maybeSingle();

  if (fromError || !fromUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const { error: updateError } = await req.supabase
    .from("friends")
    .update({ status: "accepted" })
    .eq("user_id", req.user.id)
    .eq("friend_user_id", fromUser.id)
    .eq("status", "pending");

  if (updateError) {
    console.error("accept update error:", updateError);
    res.status(500).json({ error: "Internal server error" });
    return;
  }

  const { error: upsertError } = await supabaseAdmin
    .from("friends")
    .upsert(
      {
        user_id: fromUser.id,
        friend_user_id: req.user.id,
        status: "accepted",
      },
      { onConflict: "user_id,friend_user_id" }
    );

  if (upsertError) {
    console.error("reciprocal insert error:", upsertError);
    res.status(500).json({ error: "Internal server error" });
    return;
  }

  res.json({ message: "Friend request accepted" });
});

friendRouter.post("/reject", async (req, res): Promise<void> => {
  const { email, username } = req.body as { email?: string; username?: string };

  if (!email && !username) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }

  const { data: fromUser, error: fromError } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .or(
      email ? `email.eq.${email}` : `username.eq.${username}`
    )
    .maybeSingle();

  if (fromError || !fromUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const { error } = await req.supabase
    .from("friends")
    .update({ status: "rejected" })
    .eq("user_id", req.user.id)
    .eq("friend_user_id", fromUser.id)
    .eq("status", "pending");

  if (error) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }

  res.json({ message: "Friend request rejected" });
});

friendRouter.post("/remove", async (req, res): Promise<void> => {
  const { email, username } = req.body as { email?: string; username?: string };

  if (!email && !username) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }

  const { data: friend, error: friendError } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .or(
      email ? `email.eq.${email}` : `username.eq.${username}`
    )
    .maybeSingle();

  if (friendError || !friend) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const { error: deleteError } = await req.supabase
    .from("friends")
    .delete()
    .eq("user_id", req.user.id)
    .eq("friend_user_id", friend.id);

  if (deleteError) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }

  const { error: reciprocalError } = await supabaseAdmin
    .from("friends")
    .delete()
    .eq("user_id", friend.id)
    .eq("friend_user_id", req.user.id);

  if (reciprocalError) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }

  res.json({ message: "Friend removed" });
});

export default friendRouter;
