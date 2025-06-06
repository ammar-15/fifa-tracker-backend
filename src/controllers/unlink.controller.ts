import fs from "fs/promises";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import FileUpload from "../models/FileUpload.js";


const UPLOADS_DIR = path.join(__dirname, "../../uploads");
const INTERVAL = 60 * 60 * 1000;

export async function removeOldFiles() {
  console.log("running cleanup task...");

  try {
    const files = await FileUpload.findAll();
    const now = Date.now();

    for (const fileRecord of files) {
      const filePath = path.join(UPLOADS_DIR, fileRecord.filename);

      try {
        const stats = await fs.stat(filePath);
        const ageSeconds = Math.floor((now - stats.mtimeMs) / 1000);

        console.log(`${fileRecord.filename} is ${ageSeconds}s old`);

        if (ageSeconds > 3600) {
          await fs.unlink(filePath);
          await FileUpload.destroy({ where: { id: fileRecord.id } });
          console.log(`deleted ${fileRecord.filename}`);
        }
      } catch (err) {
        if (err && typeof err === "object" && "code" in err && (err as any).code === "ENOENT") {
          await FileUpload.destroy({ where: { id: fileRecord.id } });
          console.log(`file missing, removed db record: ${fileRecord.filename}`);
        } else {
          console.error(`error for file ${fileRecord.filename}:`, err);
        }
      }
    }
  } catch (err) {
    console.error("cleanup failed:", err);
  }
}

// Only run automatically if not in test
if (process.env.NODE_ENV !== "test") {
  removeOldFiles();
  setInterval(removeOldFiles, INTERVAL);
}
