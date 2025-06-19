import express, { Request, Response } from "express";
import { runOCR } from "../service/Ocr.worker.js";
import { parseOcrResult, ParsedResult } from "../service/Ocr.parser.js";
import FileUpload from "../models/FileUpload.js";
import MatchData from "../models/MatchData.js";
import User from "../models/User.js";
import { randomUUID } from "crypto";

const parsedRoutes = express.Router();

parsedRoutes.get("/", async (req: Request, res: Response) => {
  try {
    const { ocrText, email, userId } = await runOCR();
    const parsedStats: ParsedResult = parseOcrResult(ocrText);

    const uploader = await FileUpload.findOne({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    const user = await User.findOne({
      where: { email: uploader?.email ?? email },
    });

    parsedStats.player1 = user?.username ?? "unavailable";
    parsedStats.player2 = "opponent";
    const uniqueid = randomUUID();

    const match = await MatchData.create({
      uniqueid,
      email: uploader?.email ?? "unknown",
      username: parsedStats.player1,
      oppUsername: parsedStats.player2,
      team1: parsedStats.team1,
      team1Goals: parsedStats.team1Goals,
      team2: parsedStats.team2,
      team2Goals: parsedStats.team2Goals,
      timePlayed: parsedStats.timePlayed,
      stats: parsedStats.stats,
    });
    console.log(JSON.stringify(match.toJSON(), null, 2));

    res.json({
      message: "Parsed stats saved to DB",
      uniqueid,
      data: match.toJSON(),
    });
  } catch (err) {
    console.error("Error in /parsed route:", err);
    res.status(500).json({ error: "Failed to parse OCR and save" });
  }
});

export default parsedRoutes;
