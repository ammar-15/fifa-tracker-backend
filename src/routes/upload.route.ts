import express from "express";
import { upload } from "../utils/multer.js";
import { runOCR } from "../service/Ocr.worker.js";
import { requireUser } from "../middleware/requireUser.js";

const uploadRoutes = express.Router();

uploadRoutes.post(
  "/upload",
  requireUser,
  upload.single("image"),
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      if (!req.file) {
        console.log("file not uploaded");
        res.status(400).json({ error: "file not uploaded" });
        return;
      }

      const { data: fileRecord, error } = await req.supabase
        .from("file_uploads")
        .insert({
          filename: req.file.filename,
          path: req.file.path,
          mimetype: req.file.mimetype,
          size: req.file.size,
          user_id: req.user.id,
          email: req.user.email,
        })
        .select("*")
        .single();

      if (error) {
        console.error("file insert error:", error);
        res.status(500).json({ error: "server error during upload" });
        return;
      }

      console.log("file saved in db:", fileRecord?.filename);
      console.log("email associated with file:", fileRecord?.email);

      const ocrResult = await runOCR(req.supabase, req.user.id);
      console.log("OCR result:", ocrResult);

      res.status(200).json({
        message: "file uploaded and ocr completed successfully",
        filePath: req.file.path,
      });
    } catch (err) {
      console.error("upload error:", err);
      res.status(500).json({ error: "server error during upload" });
    }
  }
);

uploadRoutes.get("/files", requireUser, async (req, res) => {
  const { data, error } = await req.supabase
    .from("file_uploads")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: "failed to fetch files" });
    return;
  }

  res.json(data ?? []);
});

export default uploadRoutes;
