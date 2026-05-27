import { getDb, initDatabase } from "@/src/database";
import type { TeamData } from "@/src/types";

let ready = false;

async function ensureReady() {
  if (!ready) {
    await initDatabase();
    ready = true;
  }
}

export async function ensureSqliteTeamIdForContextTeam(team: TeamData): Promise<number> {
  await ensureReady();
  const db = getDb();

  const existing = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM teams WHERE teamName = ?",
    team.teamName,
  );
  if (existing) return existing.id;

  const result = await db.runAsync(
    "INSERT INTO teams (teamName, yearLevel, createdAt) VALUES (?, ?, ?)",
    team.teamName,
    team.members[0]?.grade ?? "Unknown",
    team.createdAt,
  );
  return result.lastInsertRowId;
}
