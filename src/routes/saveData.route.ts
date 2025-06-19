import express from "express";
import MatchData from "../models/MatchData.js";

const saveDataRouter = express.Router();

const saveData: express.RequestHandler = async (req, res) => {
  try {
    const { uniqueid, username, oppUsername, team1, team1Goals, team2, team2Goals, timePlayed, stats } = req.body;

    if (!uniqueid) {
      res.status(400).json({ error: "Missing uniqueid" });
      return;
    }

    const match = await MatchData.findOne({ where: { uniqueid } });

    if (!match) {
      res.status(404).json({ error: "Match not found with uniqueid" });
      return;
    }

    match.username = username;
    match.oppUsername = oppUsername;
    match.team1 = team1;
    match.team1Goals = team1Goals;
    match.team2 = team2;
    match.team2Goals = team2Goals;
    match.timePlayed = timePlayed;
    match.stats = stats;

    await match.save();

    res.json({ message: "Match data updated successfully", match: match.toJSON() });
  } catch (err) {
    console.error("Error saving match data:", err);
    res.status(500).json({ error: "Failed to save match data" });
  }
};

saveDataRouter.put("/", saveData);

export default saveDataRouter;
