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

  // Preferred: resolve by unique team discriminator via previously stored results.
  const byDiscriminator = await db.getFirstAsync<{ sqliteTeamId: number }>(
    `SELECT sqliteTeamId
     FROM challenge_results
     WHERE teamDiscriminator = ?
     ORDER BY createdAt DESC
     LIMIT 1`,
    team.discriminator,
  );
  if (byDiscriminator?.sqliteTeamId) return byDiscriminator.sqliteTeamId;

  // Fallback for pre-claim sessions: match by team name + createdAt together.
  const existing = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM teams WHERE teamName = ? AND createdAt = ? LIMIT 1",
    team.teamName,
    team.createdAt,
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
