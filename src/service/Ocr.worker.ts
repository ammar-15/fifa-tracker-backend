import { createWorker } from "tesseract.js";
import path from "path";
import fs from "fs/promises";
import FileUpload from "../models/FileUpload.js";

export async function runOCR() {
  const latestUpload = await FileUpload.findOne({
    order: [["createdAt", "DESC"]],
  });

  if (!latestUpload) throw new Error("no file found in FileUpload table.");

  const absoluteImagePath = path.join(
    process.cwd(),
    "uploads",
    latestUpload.filename
  );

  const worker = await createWorker();
  await worker.load("eng");
  await worker.reinitialize("eng");

  const {
    data: { text },
  } = await worker.recognize(absoluteImagePath);
  console.log(text);
  await worker.terminate();

  const result = {
    userId: latestUpload.userId,
    email: latestUpload.email,
    filename: latestUpload.filename,
    ocrText: text,
  };

  const utilsDir = path.join(process.cwd(), "src/utils");
  const outputPath = path.join(utilsDir, "ocr.result.json");

  try {
    await fs.mkdir(utilsDir, { recursive: true });
  } catch (err) {
    console.error("error in making utils directory:", err);
  }

  await fs.writeFile(outputPath, JSON.stringify(result, null, 2));

  console.log("OCR completed and saved");
  return result;
}
