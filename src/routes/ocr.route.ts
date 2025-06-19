import express from "express";
import { runOCR } from "../service/Ocr.worker.js";

const router = express.Router();
router.get("/", async (req, res, next) => {
  try {
    const result = await runOCR();
    console.log("OCR Result:", result);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
export default router;
