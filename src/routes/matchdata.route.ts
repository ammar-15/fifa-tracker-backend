import express, { Request, Response } from "express";
import MatchData from "../models/MatchData.js";
import { Op } from "sequelize";

const matchDataRouter = express.Router();

matchDataRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.query;

    if (!username || typeof username !== "string") {
      res.status(400).json({ error: "Invalid username" });
      return;
    }

    const matches = await MatchData.findAll({
      where: {
        [Op.or]: [{ username }, { oppUsername: username }],
      },
      order: [["createdAt", "DESC"]],
    });

    res.json(matches);
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

      const match = await MatchData.findOne({ where: { uniqueid } });

      if (!match) {
        console.warn("No match found for uniqueid:", uniqueid);
        res.status(404).json({ error: "Match not found" });
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

      console.log("Match updated successfully for:", uniqueid);

      res.json({ message: "Stats updated" });
    } catch (error) {
      console.error("Failed to update match stats:", error);
      res.status(500).json({ error: "Server Error" });
    }
  }
);

export default matchDataRouter;
