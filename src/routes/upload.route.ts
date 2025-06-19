import express from "express";
import { upload } from "../utils/multer.js";
import FileUpload from "../models/FileUpload.js";
import { runOCR } from "../service/Ocr.worker.js";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const uploadRoutes = express.Router();

uploadRoutes.post(
  "/upload",
  upload.single("image"),
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      if (!req.file) {
        console.log("file not uploaded");
        res.status(400).json({ error: "file not uploaded" });
        return;
      }

      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        res.status(401).json({ error: "unauthorized" });
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        userId: string;
      };
      console.log("decoded token:", decoded);

      const userId = decoded.userId;
      if (!userId) throw new Error("userId not found in token");

      const user = await User.findByPk(userId);
      if (!user) {
        res.status(404).json({ error: "user not found" });
        return;
      }

      await FileUpload.sync();
      console.log("synced upload table");

      const fileRecord = await FileUpload.create({
        filename: req.file.filename,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size,
        userId,
        email: user.email,
      });

      console.log("file saved in db:", fileRecord.filename);
      console.log("email associated with file:", fileRecord.email);

      const ocrResult = await runOCR();
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

uploadRoutes.get("/files", async (req, res) => {
  const files = await FileUpload.findAll();
  res.json(files);
});

export default uploadRoutes;
