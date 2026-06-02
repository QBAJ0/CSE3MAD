import { ActivityResult } from "@/src/types";
import { storage } from "@/src/utils/storage";
import { insertChallengeResult } from "./challengeResultDb";
import { ensureSqliteTeamIdForContextTeam } from "./sqliteTeamBridge";

/**
 * Persists a claimed challenge to SQLite (Assessment 4 local relational store).
 */
export async function persistChallengeResultToSqlite(
  result: ActivityResult,
): Promise<boolean> {
  try {
    const team = await storage.getTeam();
    if (!team) {
      console.warn("[challengeResultLocal] no team in storage");
      return false;
    }

    const sqliteTeamId = await ensureSqliteTeamIdForContextTeam(team);
    await insertChallengeResult({
      resultId: result.id,
      sqliteTeamId,
      teamDiscriminator: result.teamId,
      challengeId: result.challengeId,
      teamName: result.teamName,
      points: result.points ?? 0,
      payloadJson: JSON.stringify(result),
      createdAt: result.createdAt,
    });
    return true;
  } catch (e) {
    console.error("[challengeResultLocal] SQLite save failed:", e);
    return false;
  }
}
