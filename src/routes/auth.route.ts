import express from "express";
import { me } from "../controllers/auth.controller.js";
import { requireUser } from "../middleware/requireUser.js";

const router = express.Router();

router.get("/auth/me", requireUser, me);

export default router;
