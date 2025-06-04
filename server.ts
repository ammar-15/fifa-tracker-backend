import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/auth.route.js";
import dotenv from "dotenv";
dotenv.config();
import { connectDB } from "./src/db/db.js";
import uploadRoutes from "./src/routes/upload.route.js";
import userRoutes from "./src/routes/user.route.js";

const app = express();
const port = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/", authRoutes);
app.use("/", uploadRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/", userRoutes);

connectDB();

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
