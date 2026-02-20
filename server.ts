import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./src/routes/auth.route.js";
import uploadRoutes from "./src/routes/upload.route.js";
import userRoutes from "./src/routes/user.route.js";
import ocrRoutes from "./src/routes/ocr.route.js";
import parsedRoutes from "./src/routes/parsed.route.js";
import saveDataRouter from "./src/routes/savedata.route.js";
import matchDataRouter from "./src/routes/matchdata.route.js";
import searchUserRouter from "./src/routes/searchuser.route.js";
import friendRouter from "./src/routes/friends.route.js";
import analyticsRouter from "./src/routes/analytics.route.js";
import selectfriendRouter from "./src/routes/selectfriend.route.js";
import { startCleanupWorker } from "./src/controllers/unlink.controller.js";

console.log("ENV CHECK", {
  SUPABASE_URL: !!process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
  NODE_ENV: process.env.NODE_ENV,
});

const app = express();
const port = process.env.PORT || 5050;
const allowedOrigins = ["http://localhost:5173"];

app.use(
  cors({
    origin: allowedOrigins,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/uploads", express.static("uploads"));

app.use("/", authRoutes);
app.use("/", uploadRoutes);
app.use("/", userRoutes);
app.use("/ocr", ocrRoutes);
app.use("/parsed", parsedRoutes);
app.use("/savedata", saveDataRouter);
app.use("/matchdata", matchDataRouter);
app.use("/friends", friendRouter);
app.use("/searchuser", searchUserRouter);
app.use("/api", analyticsRouter);
app.use("/selectfriend", selectfriendRouter);

if (process.env.NODE_ENV === "production") {
  startCleanupWorker();
}

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
