import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/auth.route.js";
import dotenv from "dotenv";
dotenv.config();
import { connectDB } from "./src/db/db.js";
import uploadRoutes from "./src/routes/upload.route.js";
import userRoutes from "./src/routes/user.route.js";
import "./src/controllers/unlink.controller.js";
import ocrRoutes from "./src/routes/ocr.route.js";
import parsedRoutes from "./src/routes/parsed.route.js";
import saveDataRouter from "./src/routes/savedata.route";
import matchDataRouter from "./src/routes/matchdata.route.js";
import searchUserRouter from "./src/routes/searchuser.route.js";
import friendRouter from "./src/routes/friends.route.js";

const app = express();
const port = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/", authRoutes);
app.use("/", uploadRoutes);
app.use("/ocr", ocrRoutes);
app.use("/parsed", parsedRoutes);
app.use("/savedata", saveDataRouter);
app.use("/uploads", express.static("uploads"));
app.use("/matchdata", matchDataRouter);
app.use("/friends", friendRouter);
app.use("/searchuser", searchUserRouter);
app.use("/", userRoutes);

connectDB();


app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
