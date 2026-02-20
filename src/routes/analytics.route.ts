import express from "express";
import { requireUser } from "../middleware/requireUser.js";

const router = express.Router();

router.use(requireUser);

router.get("/analyticmatches", async (req, res): Promise<void> => {
  const { friend, username, start, end } = req.query;

  if (!friend || !username || !start || !end) {
    res.status(400).json({ error: "Missing query params" });
    return;
  }

  try {
    const { data, error } = await req.supabase
      .from("match_data")
      .select("*")
      .eq("user_id", req.user.id)
      .or(
        `and(username.eq.${username},opp_username.eq.${friend}),and(username.eq.${friend},opp_username.eq.${username})`
      )
      .gte("created_at", new Date(start as string).toISOString())
      .lte("created_at", new Date(end as string).toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to fetch matches:", error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    res.json(data ?? []);
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
    const { data: matches, error } = await req.supabase
      .from("match_data")
      .select("*")
      .eq("user_id", req.user.id)
      .or(
        `and(username.eq.${username},opp_username.eq.${friend}),and(username.eq.${friend},opp_username.eq.${username})`
      )
      .gte("created_at", new Date(start as string).toISOString())
      .lte("created_at", new Date(end as string).toISOString());

    if (error) {
      console.error("Failed to fetch matches:", error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    const relevantStats = [
      "Goals",
      "Possession",
      "Passes",
      "Shots",
      "Tackles",
      "Saves",
    ];

    const totals: Record<string, Record<string, number>> = {
      user: Object.fromEntries(relevantStats.map((s) => [s, 0])),
      friend: Object.fromEntries(relevantStats.map((s) => [s, 0])),
    };

    for (const match of matches ?? []) {
      const userIsLeft = match.username === username;

      const userGoals = parseFloat(
        userIsLeft ? match.team1_goals : match.team2_goals
      );
      const friendGoals = parseFloat(
        userIsLeft ? match.team2_goals : match.team1_goals
      );

      if (!isNaN(userGoals)) totals.user["Goals"] += userGoals;
      if (!isNaN(friendGoals)) totals.friend["Goals"] += friendGoals;

      const statsArray = Array.isArray(match.stats)
        ? match.stats
        : Object.values(match.stats ?? {});

      for (const stat of statsArray) {
        const statName = stat.stat;
        if (!relevantStats.includes(statName) || statName === "Goals") continue;

        const userVal = parseFloat(userIsLeft ? stat.left : stat.right);
        const friendVal = parseFloat(userIsLeft ? stat.right : stat.left);

        if (!isNaN(userVal)) totals.user[statName] += userVal;
        if (!isNaN(friendVal)) totals.friend[statName] += friendVal;
      }
    }

    const userRelative: number[] = [];
    const friendRelative: number[] = [];

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
    const { data: matches, error } = await req.supabase
      .from("match_data")
      .select("*")
      .eq("user_id", req.user.id)
      .or(
        `and(username.eq.${username},opp_username.eq.${friend}),and(username.eq.${friend},opp_username.eq.${username})`
      )
      .gte("created_at", new Date(start as string).toISOString())
      .lte("created_at", new Date(end as string).toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to fetch stats:", error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    const statMap: Record<
      string,
      { labels: string[]; userValues: number[]; friendValues: number[] }
    > = {};

    for (const match of matches ?? []) {
      const dateLabel = new Date(match.created_at).toLocaleDateString();
      const userIsLeft = match.username === username;

      const userGoals = parseFloat(
        userIsLeft ? match.team1_goals : match.team2_goals
      );
      const friendGoals = parseFloat(
        userIsLeft ? match.team2_goals : match.team1_goals
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
        : Object.values(match.stats ?? {});

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
