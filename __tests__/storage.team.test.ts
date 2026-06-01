// @author Stacey

import { storage } from "@/src/utils/storage";
import { TeamData } from "@/src/types";

const testTeam: TeamData = {
  teamName: "Test Team",
  discriminator: "#9999",
  members: [{ name: "Stacey", grade: "Year 10" }],
  createdAt: "2026-01-01T00:00:00.000Z",
  totalPoints: 0,
  completedChallenges: [],
};

beforeEach(async () => {
  await storage.clearAll();
});

// ─── Team storage ─────────────────────────────────────────────────────────────

describe("storage — team", () => {
  it("saveTeam then getTeam returns the same team data", async () => {
    await storage.saveTeam(testTeam);
    const result = await storage.getTeam();
    expect(result).toEqual(testTeam);
  });

  it("getTeam returns null when storage is empty", async () => {
    const result = await storage.getTeam();
    expect(result).toBeNull();
  });
});

// ─── Badge storage ────────────────────────────────────────────────────────────

describe("storage — badges", () => {
  it("unlockBadges then getEarnedBadges includes the unlocked badge", async () => {
    await storage.unlockBadges(["badge1"]);
    const badges = await storage.getEarnedBadges();
    expect(badges).toContain("badge1");
  });

  it("unlocking the same badge twice does not create duplicates", async () => {
    await storage.unlockBadges(["badge1"]);
    await storage.unlockBadges(["badge1"]);
    const badges = await storage.getEarnedBadges();
    expect(badges.filter((b) => b === "badge1")).toHaveLength(1);
  });
});
