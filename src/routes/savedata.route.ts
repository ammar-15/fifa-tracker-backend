import express from "express";
import { randomUUID } from "crypto";
import { requireUser } from "../middleware/requireUser.js";

const saveDataRouter = express.Router();

saveDataRouter.use(requireUser);

const saveData: express.RequestHandler = async (req, res) => {
  try {
    const {
      username,
      oppUsername,
      team1,
      team1Goals,
      team2,
      team2Goals,
      timePlayed,
      stats,
    } = req.body;

    const { data, error } = await req.supabase
      .from("match_data")
      .insert({
        user_id: req.user.id,
        email: req.user.email,
        uniqueid: randomUUID(),
        username,
        opp_username: oppUsername,
        team1,
        team1_goals: team1Goals,
        team2,
        team2_goals: team2Goals,
        time_played: timePlayed,
        stats,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Error saving match data:", error);
      res.status(500).json({ error: "Failed to save match data" });
      return;
    }

    res.json({
      message: "Match data added successfully",
      match: data,
    });
  } catch (err) {
    console.error("Error saving match data:", err);
    res.status(500).json({ error: "Failed to save match data" });
  }
};

saveDataRouter.post("/", saveData);

export default saveDataRouter;
