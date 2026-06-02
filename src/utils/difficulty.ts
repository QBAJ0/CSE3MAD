import { DifficultyMode, TeamMember } from "../types";

const YEAR_NUMBERS: Record<string, number> = {
  "Year 5": 5,
  "Year 6": 6,
  "Year 7": 7,
  "Year 8": 8,
  "Year 9": 9,
  "Year 10": 10,
};

export function getDifficultyFromYearLevels(
  members: TeamMember[]
): DifficultyMode {
  const years = members
    .map((m) => YEAR_NUMBERS[m.grade ?? ""] ?? 0)
    .filter((n) => n > 0);
  if (years.length === 0) return "primary";
  return Math.max(...years) >= 7 ? "highSchool" : "primary";
}

/** Human-readable year level(s) for Firestore and reports (highest year if multiple). */
export function getTeamYearLevelLabel(members: TeamMember[]): string {
  const grades = members
    .map((m) => m.grade?.trim())
    .filter((g): g is string => Boolean(g));
  if (grades.length === 0) return "Unknown";
  const yearNums = grades
    .map((g) => YEAR_NUMBERS[g] ?? 0)
    .filter((n) => n > 0);
  if (yearNums.length === 0) return grades.join(", ");
  const maxYear = Math.max(...yearNums);
  const maxLabel = Object.entries(YEAR_NUMBERS).find(([, n]) => n === maxYear)?.[0];
  if (grades.length === 1 && maxLabel) return maxLabel;
  return maxLabel ? `${maxLabel} (team: ${grades.join(", ")})` : grades.join(", ");
}
