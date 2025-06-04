import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, username, password } = req.body;
    const updateData: any = {};

    if (username) updateData.username = username;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (req.file) updateData.profilePhoto = req.file.path;
    console.log("REQ FILE:", req.file);
    console.log("Uploaded file path:", req.file?.path);

    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(404).json({ message: "user not found" });
      return;
    }

    await user.update(updateData);

    const { password: _, createdAt, updatedAt, ...safeUser } = user.toJSON();
    res.status(200).json({ message: "profile updated", user: safeUser });
  } catch (error) {
    await res.status(500).json({ message: "update failed", error });
  }
};

export const getUserProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email } = req.query;

  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "email is required as query param" });
    return;
  }

  try {
    const user = await User.findOne({
      where: { email },
      attributes: ["userId", "email", "username", "profilePhoto"],
    });
    if (!user) {
      res.status(404).json({ message: "user not found" });
      return;
    }

    const { password, createdAt, updatedAt, ...safeUser } = user.toJSON();
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    if (safeUser.profilePhoto) {
      safeUser.profilePhoto = `${baseUrl}/${safeUser.profilePhoto}`;
    }
    res.status(200).json({ user: safeUser });
  } catch (error) {
    res.status(500).json({ message: "failed to fetch user", error });
  }
};
