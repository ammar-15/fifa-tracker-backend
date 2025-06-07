import { createWorker } from "tesseract.js";

export async function runOCR() {
  const worker =  await createWorker('eng');
  const {
    data: { text },
  } = await worker.recognize("./uploads/1749447054062-95681880.jpeg");
  console.log(text);
  await worker.terminate();
  return text;
}