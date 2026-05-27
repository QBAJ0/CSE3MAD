import { persistChallengeResultToSqlite } from "@/src/services/challengeResultLocal";
import {
  fetchChallengeResultById,
  parseChallengePayload,
} from "@/src/services/challengeResultDb";
import { ActivityResult } from "@/src/types";
import { storage } from "@/src/utils/storage";

const sampleResult: ActivityResult = {
  id: "draft-test-1",
  challengeId: 1,
  teamId: "#1234",
  teamName: "Test Team",
  difficulty: "primary",
  prediction: "It will fall slowly",
  prototypes: [
    { index: 1, measurements: { fallTimeSeconds: 2.1 }, capturedAt: "2026-01-01T00:00:00.000Z" },
  ],
  rating: 4,
  reflection: "We learned about air resistance.",
  points: 120,
  completedInTime: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

const testTeam = {
  teamName: "Test Team",
  discriminator: "#1234",
  members: [{ name: "Alex", year: "Year 7", grade: "Year 7" }],
  createdAt: "2026-01-01T00:00:00.000Z",
  totalPoints: 0,
  completedChallenges: [] as number[],
};

describe("challengeResultLocal", () => {
  beforeEach(async () => {
    await storage.clearAll();
    await storage.saveTeam(testTeam);
    const loaded = await storage.getTeam();
    expect(loaded?.discriminator).toBe("#1234");
  });

  it("persists challenge claim to SQLite challenge_results", async () => {
    const ok = await persistChallengeResultToSqlite(sampleResult);
    expect(ok).toBe(true);

    const row = await fetchChallengeResultById(sampleResult.id);
    expect(row).not.toBeNull();
    expect(row?.challengeId).toBe(1);
    expect(row?.teamDiscriminator).toBe("#1234");

    const parsed = parseChallengePayload(row!);
    expect(parsed.reflection).toBe(sampleResult.reflection);
    expect(parsed.points).toBe(120);
  });
});
