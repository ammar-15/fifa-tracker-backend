import express, { Request, Response } from "express";
import { runOCR } from "../service/Ocr.worker.js";
import { parseOcrResult, ParsedResult } from "../service/Ocr.parser.js";
import { randomUUID } from "crypto";
import { requireUser } from "../middleware/requireUser.js";

const parsedRoutes = express.Router();

parsedRoutes.use(requireUser);

parsedRoutes.get("/", async (req: Request, res: Response) => {
  try {
    const { ocrText, email, userId } = await runOCR(
      req.supabase,
      req.user.id
    );
    const parsedStats: ParsedResult = parseOcrResult(ocrText);

    const { data: profile } = await req.supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .maybeSingle();

    parsedStats.player1 = profile?.username ?? "unavailable";
    parsedStats.player2 = "opponent";

    const uniqueid = randomUUID();

    res.json({
      message: "Parsed stats generated",
      data: parsedStats,
      uniqueid,
      email,
    });
  } catch (err) {
    console.error("Error in /parsed route:", err);
    res.status(500).json({ error: "Failed to parse OCR" });
  }
});

export default parsedRoutes;
