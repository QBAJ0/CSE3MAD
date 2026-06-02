import { getDb, initDatabase } from "@/src/database";
import type {
  ChallengeResultInput,
  ChallengeResultRow,
} from "@/src/types/db";
import { ActivityResult } from "@/src/types";

let ready = false;

async function ensureReady(): Promise<void> {
  if (!ready) {
    await initDatabase();
    ready = true;
  }
}

export async function insertChallengeResult(
  input: ChallengeResultInput,
): Promise<void> {
  await ensureReady();
  const db = getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO challenge_results (
      resultId, sqliteTeamId, teamDiscriminator, challengeId, teamName, points, payloadJson, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    input.resultId,
    input.sqliteTeamId,
    input.teamDiscriminator,
    input.challengeId,
    input.teamName,
    input.points,
    input.payloadJson,
    input.createdAt,
  );
}

export async function fetchChallengeResultById(
  resultId: string,
): Promise<ChallengeResultRow | null> {
  await ensureReady();
  const db = getDb();
  return db.getFirstAsync<ChallengeResultRow>(
    `SELECT resultId, sqliteTeamId, teamDiscriminator, challengeId, teamName, points, payloadJson, createdAt
     FROM challenge_results WHERE resultId = ?`,
    resultId,
  );
}

export function parseChallengePayload(row: ChallengeResultRow): ActivityResult {
  return JSON.parse(row.payloadJson) as ActivityResult;
}
