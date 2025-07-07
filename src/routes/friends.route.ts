import express from "express";
import FriendsList from "../models/Friends.js";
import User from "../models/User.js";
import { Op } from "sequelize";

const friendRouter = express.Router();

friendRouter.get("/", async (req, res): Promise<void> => {
  const { username } = req.query;

  if (!username || typeof username !== "string") {
    res.status(400).json({ error: "Invalid username" });
    return;
  }

  const accepted = await FriendsList.findAll({
    where: {
      status: "accepted",
      [Op.or]: [{ from: username }, { to: username }],
    },
  });

  const requests = await FriendsList.findAll({
    where: { to: username, status: "pending" },
  });

  const friends = await Promise.all(
    accepted.map(async (f) => {
      const friendUsername = f.from === username ? f.to : f.from;
      const friend = await User.findOne({
        where: { username: friendUsername },
      });
      return { username: friend?.username, email: friend?.email };
    })
  );

  const pending = await Promise.all(
    requests.map(async (f) => {
      const user = await User.findOne({ where: { username: f.from } });
      return user
        ? {
            from: f.from,
            to: f.to,
            username: user.username,
            email: user.email,
          }
        : null;
    })
  );


  res.json({
    friends,
    requests: pending.filter(Boolean),
  });
});

friendRouter.post("/request", async (req, res): Promise<void> => {
  try {
    console.log("Incoming body:", req.body);
    const { from, to } = req.body;

    if (!from || !to) {
      console.log("Missing fields:", { from, to });
      res.status(400).json({ error: "Missing fields" });
      return;
    }

    const exists = await FriendsList.findOne({ where: { from, to } });
    if (exists) {
      res.status(400).json({ error: "Already sent" });
      return;
    }

    await FriendsList.create({ from, to });
    res.json({ message: "Friend request sent" });
  } catch (error) {
    console.error("POST /friends/request failed:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

friendRouter.post("/accept", async (req, res): Promise<void> => {
  const { username, email } = req.body;
  const toUser = await User.findOne({ where: { email } });

  if (!toUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  await FriendsList.update(
    { status: "accepted" },
    { where: { from: toUser.username, to: username } }
  );
  res.json({ message: "Friend request accepted" });
});

friendRouter.post("/reject", async (req, res): Promise<void> => {
  const { username, email } = req.body;
  const toUser = await User.findOne({ where: { email } });

  if (!toUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  await FriendsList.update(
    { status: "rejected" },
    { where: { from: toUser.username, to: username } }
  );
  res.json({ message: "Friend request rejected" });
});

friendRouter.post("/remove", async (req, res): Promise<void> => {
  const { username, email } = req.body;

  const friend = await User.findOne({ where: { email } });
  if (!friend) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const friendUsername = friend.username;

  await FriendsList.destroy({
    where: {
      [Op.or]: [
        { from: username, to: friendUsername },
        { from: friendUsername, to: username },
      ],
    },
  });

  res.json({ message: "Friend removed" });
});


export default friendRouter;
