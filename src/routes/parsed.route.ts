import express, { Request, Response } from "express";
import { runOCR } from "../service/Ocr.worker.js";
import { parseOcrResult, ParsedResult } from "../service/Ocr.parser.js";
import FileUpload from "../models/FileUpload.js";
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

    res.json({
      message: "Parsed stats generated",
      data: parsedStats,
      uniqueid, 
    });
  } catch (err) {
    console.error("Error in /parsed route:", err);
    res.status(500).json({ error: "Failed to parse OCR" });
  }
});

export default parsedRoutes;
