/**
 * Web: expo-sqlite’s WASM bundle is not wired in this project’s install, so we
 * avoid importing `expo-sqlite` on web. This in-memory store matches the SQL
 * used by `teamDb` and `resultDb` only — data resets on full page reload.
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

type ActivityResultRow = {
  id: number;
  teamId: number;
  activityId: string;
  activityName: string;
  score: number;
  sensorValue: number | null;
  notes: string | null;
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
  private activityResults: ActivityResultRow[] = [];
  private nextTeamId = 1;
  private nextMemberId = 1;
  private nextResultId = 1;

  async execAsync(_source: string): Promise<void> {
    // Schema is implicit; matches native initDatabase no-op for our usage.
  }

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

    if (s.startsWith("insert into activity_results")) {
      const [
        teamId,
        activityId,
        activityName,
        score,
        sensorValue,
        notes,
        createdAt,
      ] = binds as [
        number,
        string,
        string,
        number,
        number | null,
        string | null,
        string,
      ];
      const id = this.nextResultId++;
      this.activityResults.push({
        id,
        teamId: Number(teamId),
        activityId: String(activityId),
        activityName: String(activityName),
        score: Number(score),
        sensorValue:
          sensorValue === null || sensorValue === undefined
            ? null
            : Number(sensorValue),
        notes: notes == null ? null : String(notes),
        createdAt: String(createdAt),
      });
      return { lastInsertRowId: id, changes: 1 };
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
      s.includes("from activity_results") &&
      s.includes("where teamid =")
    ) {
      const teamId = Number(binds[0]);
      return this.activityResults
        .filter((r) => r.teamId === teamId)
        .sort((a, b) => {
          const c = b.createdAt.localeCompare(a.createdAt);
          return c !== 0 ? c : b.id - a.id;
        }) as T[];
    }

    if (s.includes("from activity_results") && !s.includes("where")) {
      return [...this.activityResults].sort((a, b) => {
        const c = b.createdAt.localeCompare(a.createdAt);
        return c !== 0 ? c : b.id - a.id;
      }) as T[];
    }

    if (
      s.includes("from activity_results r") &&
      s.includes("inner join teams t")
    ) {
      const byTeam = new Map<
        number,
        { teamName: string; totalScore: number; count: number }
      >();
      for (const r of this.activityResults) {
        const team = this.teams.find((t) => t.id === r.teamId);
        if (!team) continue;
        const cur = byTeam.get(team.id) ?? {
          teamName: team.teamName,
          totalScore: 0,
          count: 0,
        };
        cur.totalScore += r.score;
        cur.count += 1;
        byTeam.set(team.id, cur);
      }
      const rows = [...byTeam.entries()]
        .map(([teamId, v]) => ({
          teamId,
          teamName: v.teamName,
          totalScore: v.totalScore,
          completedActivityCount: v.count,
        }))
        .sort((a, b) => {
          if (b.totalScore !== a.totalScore) {
            return b.totalScore - a.totalScore;
          }
          return a.teamName.localeCompare(b.teamName);
        });
      return rows as T[];
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
