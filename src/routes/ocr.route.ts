import express from "express";
import { runOCR } from "../service/Ocr.worker.js";
import { requireUser } from "../middleware/requireUser.js";

const router = express.Router();
router.get("/", requireUser, async (req, res, next) => {
  try {
    const result = await runOCR(req.supabase, req.user.id);
    console.log("OCR Result:", result);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
export default router;
