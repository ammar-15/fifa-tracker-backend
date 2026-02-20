import { createWorker } from "tesseract.js";
import path from "path";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function runOCR(supabase: SupabaseClient, userId: string) {
  const { data: latestUpload, error } = await supabase
    .from("file_uploads")
    .select("id, filename, user_id, email, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`failed to fetch file upload: ${error.message}`);
  }

  if (!latestUpload) throw new Error("no file found in file_uploads table.");

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
    userId: latestUpload.user_id,
    email: latestUpload.email,
    filename: latestUpload.filename,
    ocrText: text,
  };

  console.log("OCR completed and saved");
  return result;
}
