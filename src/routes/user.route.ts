import express from "express";
import { upload } from "../utils/multer.js";
import { updateUser, getUserProfile } from "../controllers/user.controller.js";
import { requireUser } from "../middleware/requireUser.js";

const router = express.Router();

router.use(requireUser);
router.put("/userprofile", upload.single("profilePhoto"), updateUser);
router.get("/userprofile", getUserProfile);

export default router;
