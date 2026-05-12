import { initDatabase, getDb } from "@/src/database";
import type { LocalMember, LocalTeam, TeamWithMembers } from "@/src/types/db";

let ready = false;

async function ensureReady(): Promise<void> {
  if (!ready) {
    await initDatabase();
    ready = true;
  }
}

export async function insertTeam(
  teamName: string,
  yearLevel: string,
  createdAt: string,
): Promise<number> {
  await ensureReady();
  const db = getDb();
  const result = await db.runAsync(
    "INSERT INTO teams (teamName, yearLevel, createdAt) VALUES (?, ?, ?)",
    teamName,
    yearLevel,
    createdAt,
  );
  return Number(result.lastInsertRowId);
}

export async function insertMember(
  teamId: number,
  memberName: string,
): Promise<void> {
  await ensureReady();
  const db = getDb();
  await db.runAsync(
    "INSERT INTO members (teamId, memberName) VALUES (?, ?)",
    teamId,
    memberName,
  );
}

export async function fetchTeamWithMembers(
  teamId: number,
): Promise<TeamWithMembers | null> {
  await ensureReady();
  const db = getDb();
  const team = await db.getFirstAsync<LocalTeam>(
    "SELECT id, teamName, yearLevel, createdAt FROM teams WHERE id = ?",
    teamId,
  );
  if (!team) return null;
  const members = await db.getAllAsync<LocalMember>(
    "SELECT id, teamId, memberName FROM members WHERE teamId = ? ORDER BY id ASC",
    teamId,
  );
  return { team, members };
}

export async function fetchAllTeams(): Promise<LocalTeam[]> {
  await ensureReady();
  const db = getDb();
  return db.getAllAsync<LocalTeam>(
    "SELECT id, teamName, yearLevel, createdAt FROM teams ORDER BY id DESC",
  );
}
