/**
 * Web: in-memory SQLite shim for `teamDb` + `challengeResultDb` (resets on reload).
 */

import type { AppSqliteDb } from "./database.types";

type TeamRow = {
  id: number;
  teamName: string;
  yearLevel: string;
  createdAt: string;
};

type MemberRow = {
  id: number;
  teamId: number;
  memberName: string;
};

type ChallengeResultRow = {
  resultId: string;
  sqliteTeamId: number;
  teamDiscriminator: string;
  challengeId: number;
  teamName: string;
  points: number;
  payloadJson: string;
  createdAt: string;
};

function bindArgs(rest: unknown[]): unknown[] {
  if (rest.length === 1 && Array.isArray(rest[0])) {
    return rest[0] as unknown[];
  }
  return rest;
}

function norm(sql: string): string {
  return sql.replace(/\s+/g, " ").trim().toLowerCase();
}

class WebMemoryDatabase implements AppSqliteDb {
  private teams: TeamRow[] = [];
  private members: MemberRow[] = [];
  private challengeResults: ChallengeResultRow[] = [];
  private nextTeamId = 1;
  private nextMemberId = 1;

  async execAsync(_source: string): Promise<void> {}

  async runAsync(source: string, ...params: unknown[]): Promise<{
    lastInsertRowId: number;
    changes: number;
  }> {
    const binds = bindArgs(params);
    const s = norm(source);

    if (s.startsWith("insert into teams")) {
      const [teamName, yearLevel, createdAt] = binds as [
        string,
        string,
        string,
      ];
      const id = this.nextTeamId++;
      this.teams.push({ id, teamName, yearLevel, createdAt });
      return { lastInsertRowId: id, changes: 1 };
    }

    if (s.startsWith("insert into members")) {
      const [teamId, memberName] = binds as [number, string];
      const id = this.nextMemberId++;
      this.members.push({ id, teamId: Number(teamId), memberName });
      return { lastInsertRowId: id, changes: 1 };
    }

    if (s.startsWith("insert or replace into challenge_results")) {
      const [
        resultId,
        sqliteTeamId,
        teamDiscriminator,
        challengeId,
        teamName,
        points,
        payloadJson,
        createdAt,
      ] = binds as [
        string,
        number,
        string,
        number,
        string,
        number,
        string,
        string,
      ];
      const row: ChallengeResultRow = {
        resultId: String(resultId),
        sqliteTeamId: Number(sqliteTeamId),
        teamDiscriminator: String(teamDiscriminator),
        challengeId: Number(challengeId),
        teamName: String(teamName),
        points: Number(points),
        payloadJson: String(payloadJson),
        createdAt: String(createdAt),
      };
      const idx = this.challengeResults.findIndex(
        (r) => r.resultId === row.resultId,
      );
      if (idx >= 0) {
        this.challengeResults[idx] = row;
      } else {
        this.challengeResults.push(row);
      }
      return { lastInsertRowId: 0, changes: 1 };
    }

    throw new Error(`[database.web] Unsupported SQL: ${source.slice(0, 80)}…`);
  }

  async getFirstAsync<T>(source: string, ...params: unknown[]): Promise<T | null> {
    const binds = bindArgs(params);
    const s = norm(source);

    if (
      s.includes("from teams") &&
      s.includes("where id =") &&
      binds.length === 1
    ) {
      const id = Number(binds[0]);
      const row = this.teams.find((t) => t.id === id);
      return (row ?? null) as T | null;
    }

    if (
      s.includes("from challenge_results") &&
      s.includes("where resultid =")
    ) {
      const resultId = String(binds[0]);
      const row = this.challengeResults.find((r) => r.resultId === resultId);
      return (row ?? null) as T | null;
    }

    if (
      s.includes("from challenge_results") &&
      s.includes("where teamdiscriminator =")
    ) {
      const disc = String(binds[0]);
      const row = [...this.challengeResults]
        .filter((r) => r.teamDiscriminator === disc)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      return (row ?? null) as T | null;
    }

    if (
      s.includes("from teams") &&
      s.includes("where teamname =") &&
      s.includes("and createdat =")
    ) {
      const [teamName, createdAt] = binds as [string, string];
      const row = this.teams.find(
        (t) => t.teamName === String(teamName) && t.createdAt === String(createdAt),
      );
      return (row ?? null) as T | null;
    }

    return null;
  }

  async getAllAsync<T>(source: string, ...params: unknown[]): Promise<T[]> {
    const binds = bindArgs(params);
    const s = norm(source);

    if (s.includes("from members") && s.includes("where teamid =")) {
      const teamId = Number(binds[0]);
      return this.members
        .filter((m) => m.teamId === teamId)
        .sort((a, b) => a.id - b.id) as T[];
    }

    if (
      s.includes("from teams") &&
      s.includes("order by id desc") &&
      !s.includes("where")
    ) {
      return [...this.teams].sort((a, b) => b.id - a.id) as T[];
    }

    if (
      s.includes("from challenge_results") &&
      s.includes("where teamdiscriminator =")
    ) {
      const disc = String(binds[0]);
      return this.challengeResults
        .filter((r) => r.teamDiscriminator === disc)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)) as T[];
    }

    if (s.includes("from challenge_results") && !s.includes("where")) {
      return [...this.challengeResults].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ) as T[];
    }

    throw new Error(`[database.web] Unsupported SQL: ${source.slice(0, 80)}…`);
  }
}

let instance: WebMemoryDatabase | null = null;

export function getDb(): AppSqliteDb {
  if (!instance) {
    instance = new WebMemoryDatabase();
  }
  return instance;
}

export async function initDatabase(): Promise<void> {
  await getDb().execAsync("PRAGMA foreign_keys = ON;");
}
