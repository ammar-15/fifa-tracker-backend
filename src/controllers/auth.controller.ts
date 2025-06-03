import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import fs from "fs";


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateAccessToken = (userId: string, username: string): string =>
  jwt.sign({ userId, username }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, credential, username } = req.body;

  try {
    await User.sync();

    if (credential) {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const googleEmail = payload?.email;

      if (!googleEmail) {
        res.status(400).json({ error: "invalid google credential" });
        return;
      }

      const existingUser = await User.findOne({
        where: { email: googleEmail },
      });
      if (existingUser) {
        const token = generateAccessToken(
          existingUser.userId,
          existingUser.username
        );
        res.status(200).json({ token });
        return;
      }

      const newUser = await User.create({
        email: googleEmail,
        password: "",
        username,
      });

      const token = generateAccessToken(newUser.userId, newUser.username);
      res.status(200).json({ token });
      return;
    }

    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "email already in use" });
      return;
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      res.status(409).json({ error: "username already taken" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = await User.create({ email, password: hash, username });
    const token = generateAccessToken(user.userId, user.username);

    res.status(201).json({ token, message: "user created successfully!" });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    res.status(400).json({ error: "email/username and password are required" });
    return;
  }

  try {
    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: identifier }, { username: identifier }],
      },
    });

    if (!user) {
      res.status(401).json({ error: "invalid credentials" });
      return;
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      res.status(401).json({ error: "invalid credentials" });
      return;
    }

    const token = generateAccessToken(user.userId, user.username);
    res.status(200).json({
      userId: user.userId,
      email: user.email,
      access_token: token,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
