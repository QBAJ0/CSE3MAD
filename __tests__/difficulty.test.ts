// @author Stacey

import { getDifficultyFromYearLevels } from "@/src/utils/difficulty";
import { TeamMember } from "@/src/types";

function member(grade: string): TeamMember {
  return { name: "Test", grade };
}

describe("getDifficultyFromYearLevels", () => {
  it("returns primary for Year 5 and Year 6 members", () => {
    expect(getDifficultyFromYearLevels([member("Year 5"), member("Year 6")])).toBe("primary");
  });

  it("returns highSchool for a Year 7 member", () => {
    expect(getDifficultyFromYearLevels([member("Year 7")])).toBe("highSchool");
  });

  it("returns highSchool for mixed Year 9 and Year 6 (picks highest)", () => {
    expect(getDifficultyFromYearLevels([member("Year 9"), member("Year 6")])).toBe("highSchool");
  });

  it("returns primary for an empty array", () => {
    expect(getDifficultyFromYearLevels([])).toBe("primary");
  });

  it("returns primary when grade is unknown", () => {
    expect(getDifficultyFromYearLevels([member("Unknown Grade")])).toBe("primary");
  });
});
