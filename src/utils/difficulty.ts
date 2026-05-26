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
