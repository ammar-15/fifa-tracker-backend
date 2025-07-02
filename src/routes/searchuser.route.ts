import express from "express";
import User from "../models/User.js";
import { Op } from "sequelize";

const searchUserRouter = express.Router();

searchUserRouter.get("/", async (req, res): Promise<void>  => {
  const { q } = req.query;

  if (!q || typeof q !== "string") {
    res.status(400).json({ error: "Missing search query" });
    return;
}

  const users = await User.findAll({
    where: {
      [Op.or]: [
        { username: { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } },
      ],
    },
    limit: 10,
  });

  const result = users.map((user) => ({
    username: user.username,
    email: user.email,
  }));

  res.json(result);
});

export default searchUserRouter;
