import { getDb, initDatabase } from "@/src/database";
import type {
  LeaderboardRow,
  ResultInput,
  ResultRow,
} from "@/src/types/db";

let ready = false;

async function ensureReady(): Promise<void> {
  if (!ready) {
    await initDatabase();
    ready = true;
  }
}

export async function insertActivityResult(
  input: ResultInput,
): Promise<number> {
  await ensureReady();
  const db = getDb();
  const sensorValue =
    input.sensorValue === undefined || input.sensorValue === null
      ? null
      : input.sensorValue;
  const notes =
    input.notes === undefined || input.notes === null ? null : input.notes;
  const result = await db.runAsync(
    `INSERT INTO activity_results (
      teamId, activityId, activityName, score, sensorValue, notes, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    input.teamId,
    input.activityId,
    input.activityName,
    input.score,
    sensorValue,
    notes,
    input.createdAt,
  );
  return Number(result.lastInsertRowId);
}

export async function fetchAllActivityResults(): Promise<ResultRow[]> {
  await ensureReady();
  const db = getDb();
  return db.getAllAsync<ResultRow>(
    `SELECT id, teamId, activityId, activityName, score, sensorValue, notes, createdAt
     FROM activity_results
     ORDER BY createdAt DESC, id DESC`,
  );
}

export async function fetchResultsByTeam(
  teamId: number,
): Promise<ResultRow[]> {
  await ensureReady();
  const db = getDb();
  return db.getAllAsync<ResultRow>(
    `SELECT id, teamId, activityId, activityName, score, sensorValue, notes, createdAt
     FROM activity_results
     WHERE teamId = ?
     ORDER BY createdAt DESC, id DESC`,
    teamId,
  );
}

type LeaderboardAggRow = {
  teamId: number;
  teamName: string;
  totalScore: number;
  completedActivityCount: number;
};

/** SQLite lab leaderboard for /activity recordings — not Stacey challenge XP. */
export async function fetchLeaderboard(): Promise<LeaderboardRow[]> {
  await ensureReady();
  const db = getDb();
  const rows = await db.getAllAsync<LeaderboardAggRow>(
    `SELECT
       t.id AS teamId,
       t.teamName AS teamName,
       SUM(r.score) AS totalScore,
       COUNT(*) AS completedActivityCount
     FROM activity_results r
     INNER JOIN teams t ON t.id = r.teamId
     GROUP BY t.id, t.teamName
     ORDER BY totalScore DESC, t.teamName ASC`,
  );
  return rows.map((row, index) => ({
    rank: index + 1,
    teamId: row.teamId,
    teamName: row.teamName,
    totalScore: Number(row.totalScore),
    completedActivityCount: Number(row.completedActivityCount),
  }));
}
