export interface ParsedStat {
  stat: string;
  left: string;
  right: string;
}

export interface ParsedResult {
  team1: string;
  team1Goals: string;
  team2Goals: string;
  team2: string;
  player1: string;
  player2: string;
  timePlayed: string;
  stats: ParsedStat[];
}

export function parseOcrResult(rawText: string): ParsedResult {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const headerRegex = /([A-Za-z ]+)\s+(\d+)[^0-9A-Za-z]+(\d+)\s+([A-Za-z ]+)/;
  let match: RegExpMatchArray | null = null;
  for (const line of lines) {
    const candidate = line.replace(/[^A-Za-z0-9 :]/g, " ");
    match = candidate.match(headerRegex);
    if (match) break;
  }

  let team1 = "",
    team1Goals = "",
    team2Goals = "",
    team2 = "";
  if (match) {
    [, team1, team1Goals, team2Goals, team2] = match.map((s) =>
      s.trim().replace(/\s+/g, " ")
    );
  }

  const timeRegex = /\b\d{1,2}[:]\d{2}\b/;
  const timePlayed = lines.find((line) => timeRegex.test(line)) || "";

  const statList = [
    "Possession",
    "Shots",
    "Expected Goals",
    "Passes",
    "Tackles",
    "Tackles Won",
    "Interceptions",
    "Saves",
    "Fouls Committed",
    "Offsides",
    "Corners",
    "Free Kicks",
    "Penalty Kicks",
    "Yellow Cards",
    "Red Cards",
    "Possession %",
  ];

  const stats: ParsedStat[] = [];
  for (const line of lines) {
    for (const stat of statList) {
      if (line.toLowerCase().includes(stat.toLowerCase())) {
        const numbers = line.match(/(\d+(?:\.\d+)?)/g) || [];
        if (numbers.length >= 2) {
          const left: string = numbers[0] ?? "";
          const right: string = numbers[numbers.length - 1] ?? "";
          stats.push({ stat, left, right });
        }
        break;
      }
    }
  }

  return {
    team1,
    team1Goals,
    team2Goals,
    team2,
    player1: "",
    player2: "",
    timePlayed,
    stats,
  };
}
