import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import dotenv from "dotenv";
dotenv.config();
import { connectDB } from "./db/db.js";
import uploadRoutes from "./routes/uploadRoutes.js";

const app = express();
const port = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/", authRoutes);
app.use("/", uploadRoutes)
app.use("/uploads", express.static("uploads"));

connectDB();

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});