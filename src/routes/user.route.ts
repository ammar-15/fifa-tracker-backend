import express from "express";
import { upload } from "../utils/multer.js"; 
import { updateUser, getUserProfile } from "../controllers/user.controller";

const router = express.Router();

router.put("/userprofile", upload.single("profilePhoto"), updateUser);
router.get("/userprofile", getUserProfile);

export default router;
