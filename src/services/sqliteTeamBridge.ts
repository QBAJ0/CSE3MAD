import type { TeamData } from "@/src/types";

import {
  fetchAllTeams,
  fetchTeamWithMembers,
  insertMember,
  insertTeam,
} from "@/src/services/teamDb";

function primaryYearLevel(team: TeamData): string {
  const y = team.members[0]?.year?.trim();
  if (y && y.length > 0) return y;
  return "—";
}

export async function ensureSqliteTeamIdForContextTeam(
  team: TeamData,
): Promise<number> {
  const yearLevel = primaryYearLevel(team);
  const teams = await fetchAllTeams();
  const match = teams.find(
    (t) => t.teamName === team.teamName && t.yearLevel === yearLevel,
  );
  if (match) {
    const existing = await fetchTeamWithMembers(match.id);
    if (existing) {
      const names = new Set(
        existing.members.map((m) => m.memberName),
      );
      for (const m of team.members) {
        const n = m.name.trim();
        if (n.length > 0 && !names.has(n)) {
          await insertMember(match.id, n);
          names.add(n);
        }
      }
    }
    return match.id;
  }

  const createdAt = team.createdAt || new Date().toISOString();
  const id = await insertTeam(team.teamName, yearLevel, createdAt);
  for (const m of team.members) {
    const n = m.name.trim();
    if (n.length > 0) await insertMember(id, n);
  }
  return id;
}
