import express from "express";
import { Op } from "sequelize";
import MatchData from "../models/MatchData";

const router = express.Router();

router.get("/analyticmatches", async (req, res): Promise<void> => {
  const { friend, username, start, end } = req.query;

  if (!friend || !username || !start || !end) {
    res.status(400).json({ error: "Missing query params" });
    return;
  }

  try {
    const matches = await MatchData.findAll({
      where: {
        [Op.or]: [
          { username: username, oppUsername: friend },
          { username: friend, oppUsername: username },
        ],
        createdAt: {
          [Op.between]: [new Date(start as string), new Date(end as string)],
        },
      },
      order: [["createdAt", "ASC"]],
    });

    res.json(matches);
  } catch (err) {
    console.error("Failed to fetch matches:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/overallstats", async (req, res): Promise<void> => {
  const { friend, username, start, end } = req.query;

  if (!friend || !username || !start || !end) {
    res.status(400).json({ error: "Missing query params" });
    return;
  }

  try {
    const matches = await MatchData.findAll({
      where: {
        [Op.or]: [
          { username, oppUsername: friend },
          { username: friend, oppUsername: username },
        ],
        createdAt: {
          [Op.between]: [new Date(start as string), new Date(end as string)],
        },
      },
    });

    const relevantStats = [
      "Goals",
      "Possession",
      "Passes",
      "Shots",
      "Tackles",
      "Saves",
    ];

    const totals = {
      user: Object.fromEntries(relevantStats.map((s) => [s, 0])),
      friend: Object.fromEntries(relevantStats.map((s) => [s, 0])),
    };

    for (const match of matches) {
      const userIsLeft = match.username === username;

      const userGoals = parseFloat(
        userIsLeft ? match.team1Goals : match.team2Goals
      );
      const friendGoals = parseFloat(
        userIsLeft ? match.team2Goals : match.team1Goals
      );

      if (!isNaN(userGoals)) totals.user["Goals"] += userGoals;
      if (!isNaN(friendGoals)) totals.friend["Goals"] += friendGoals;

      const statsArray = Array.isArray(match.stats)
        ? match.stats
        : Object.values(match.stats);

      for (const stat of statsArray) {
        const statName = stat.stat;
        if (!relevantStats.includes(statName) || statName === "Goals") continue;

        const userVal = parseFloat(userIsLeft ? stat.left : stat.right);
        const friendVal = parseFloat(userIsLeft ? stat.right : stat.left);

        if (!isNaN(userVal)) totals.user[statName] += userVal;
        if (!isNaN(friendVal)) totals.friend[statName] += friendVal;
      }
    }

    const userRelative = [];
    const friendRelative = [];

    for (const stat of relevantStats) {
      const userVal = totals.user[stat];
      const friendVal = totals.friend[stat];
      const total = userVal + friendVal;

      if (total === 0) {
        userRelative.push(50);
        friendRelative.push(50);
      } else {
        const userPercent = parseFloat(((userVal / total) * 100).toFixed(2));
        const friendPercent = 100 - userPercent;
        userRelative.push(userPercent);
        friendRelative.push(friendPercent);
      }
    }

    const radarData = {
      labels: relevantStats,
      datasets: [
        {
          label: "You",
          data: userRelative,
        },
        {
          label: "Friend",
          data: friendRelative,
        },
      ],
    };

    res.json(radarData);
  } catch (err) {
    console.error("Failed to fetch overall stats:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/stats", async (req, res): Promise<void> => {
  const { friend, username, start, end } = req.query;

  if (!friend || !username || !start || !end) {
    res.status(400).json({ error: "Missing query params" });
    return;
  }

  try {
    const matches = await MatchData.findAll({
      where: {
        [Op.or]: [
          { username, oppUsername: friend },
          { username: friend, oppUsername: username },
        ],
        createdAt: {
          [Op.between]: [new Date(start as string), new Date(end as string)],
        },
      },
      order: [["createdAt", "ASC"]],
    });

    const statMap: Record<
      string,
      { labels: string[]; userValues: number[]; friendValues: number[] }
    > = {};

    for (const match of matches) {
      const dateLabel = new Date(match.createdAt).toLocaleDateString();
      const userIsLeft = match.username === username;

      const userGoals = parseFloat(
        userIsLeft ? match.team1Goals : match.team2Goals
      );
      const friendGoals = parseFloat(
        userIsLeft ? match.team2Goals : match.team1Goals
      );

      if (!isNaN(userGoals) && !isNaN(friendGoals)) {
        if (!statMap["Goals"]) {
          statMap["Goals"] = {
            labels: [],
            userValues: [],
            friendValues: [],
          };
        }

        statMap["Goals"].labels.push(dateLabel);
        statMap["Goals"].userValues.push(userGoals);
        statMap["Goals"].friendValues.push(friendGoals);
      }

      const statsArray = Array.isArray(match.stats)
        ? match.stats
        : Object.values(match.stats);

      for (const stat of statsArray) {
        const statName = stat.stat;

        const userValRaw = userIsLeft ? stat.left : stat.right;
        const friendValRaw = userIsLeft ? stat.right : stat.left;

        const userVal = parseFloat(userValRaw);
        const friendVal = parseFloat(friendValRaw);

        if (isNaN(userVal) || isNaN(friendVal)) continue;

        if (!statMap[statName]) {
          statMap[statName] = {
            labels: [],
            userValues: [],
            friendValues: [],
          };
        }

        statMap[statName].labels.push(dateLabel);
        statMap[statName].userValues.push(userVal);
        statMap[statName].friendValues.push(friendVal);
      }
    }

    res.json(statMap);
  } catch (err) {
    console.error("Failed to fetch stats:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
