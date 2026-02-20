import express, { Request, Response } from "express";
import { requireUser } from "../middleware/requireUser.js";

const matchDataRouter = express.Router();

matchDataRouter.use(requireUser);

matchDataRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.query;

    let query = req.supabase
      .from("match_data")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (username && typeof username === "string") {
      query = query.or(
        `username.eq.${username},opp_username.eq.${username}`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch matches:", error);
      res.status(500).json({ error: "Server Error" });
      return;
    }

    res.json(data ?? []);
  } catch (error) {
    console.error("Failed to fetch matches:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

matchDataRouter.post(
  "/updatedata",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        uniqueid,
        username,
        oppUsername,
        team1,
        team1Goals,
        team2,
        team2Goals,
        timePlayed,
        stats,
      } = req.body;

      if (!uniqueid || !stats) {
        res.status(400).json({ error: "Missing data" });
        return;
      }

      const { data, error } = await req.supabase
        .from("match_data")
        .update({
          username,
          opp_username: oppUsername,
          team1,
          team1_goals: team1Goals,
          team2,
          team2_goals: team2Goals,
          time_played: timePlayed,
          stats,
        })
        .eq("uniqueid", uniqueid)
        .eq("user_id", req.user.id)
        .select("*")
        .maybeSingle();

      if (error) {
        console.error("Failed to update match stats:", error);
        res.status(500).json({ error: "Server Error" });
        return;
      }

      if (!data) {
        console.warn("No match found for uniqueid:", uniqueid);
        res.status(404).json({ error: "Match not found" });
        return;
      }

      res.json({ message: "Stats updated" });
    } catch (error) {
      console.error("Failed to update match stats:", error);
      res.status(500).json({ error: "Server Error" });
    }
  }
);

export default matchDataRouter;
