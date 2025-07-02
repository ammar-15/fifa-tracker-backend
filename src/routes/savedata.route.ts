import express from "express";
import MatchData from "../models/MatchData.js";
import FileUpload from "../models/FileUpload.js";
import { randomUUID } from "crypto";

const saveDataRouter = express.Router();

const saveData: express.RequestHandler = async (req, res) => {
  try {
    let {
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

    const lastUpload = await FileUpload.findOne({
      order: [["createdAt", "DESC"]],
    });

    const email = lastUpload?.email ?? "unknown@example.com";

    const match = await MatchData.create({
      email,
      uniqueid: randomUUID(),
      username,
      oppUsername,
      team1,
      team1Goals,
      team2,
      team2Goals,
      timePlayed,
      stats,
    });

    match.username = username;
    match.oppUsername = oppUsername;
    match.team1 = team1;
    match.team1Goals = team1Goals;
    match.team2 = team2;
    match.team2Goals = team2Goals;
    match.timePlayed = timePlayed;
    match.stats = stats;

    await match.save();
    res.json({
      message: "Match data added successfully",
      match: match.toJSON(),
    });
  } catch (err) {
    console.error("Error saving match data:", err);
    res.status(500).json({ error: "Failed to save match data" });
  }
};

saveDataRouter.post("/", saveData);

export default saveDataRouter;
