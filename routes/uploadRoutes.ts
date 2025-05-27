import express from "express";
import { upload } from "../utils/multer.js";
import FileUpload from "../models/FileUpload.js";
import path from "path";


const uploadRoutes = express.Router();

uploadRoutes.post(
  "/upload",
  upload.single("image"),
  async (req: express.Request, res: express.Response): Promise<void> => {
    if (!req.file) {
      console.log("file not uploaded");
      res.status(400).json({ error: "file not uploaded" });
      return;
    }

    await FileUpload.sync();

    const fileRecord = await FileUpload.create({
      filename: req.file.filename,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });
    console.log('file saved in db:', fileRecord.filename);

    res
      .status(200)
      .json({ message: "file uploaded successfully", filePath: req.file.path });
  }
);

export default uploadRoutes;
