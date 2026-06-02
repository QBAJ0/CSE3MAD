import { buildLeaderboardFirestoreDoc } from "@/src/services/leaderboardFirestore";
import { ActivityResult } from "@/src/types";

const result: ActivityResult = {
  id: "r1",
  challengeId: 3,
  teamId: "#1111",
  teamName: "Team A",
  discriminator: "#1111",
  activityTitle: "Hand Fan Challenge",
  yearLevel: "Year 9",
  difficulty: "highSchool",
  prediction: "Paper bends most",
  prototypes: [],
  rating: 5,
  reflection: "Good test",
  points: 80,
  createdAt: "2026-06-01T12:00:00.000Z",
};

describe("leaderboardFirestore", () => {
  it("builds new leaderboard doc with required fields", () => {
    const doc = buildLeaderboardFirestoreDoc(result, "uid-abc");

    expect(doc.teamId).toBe("#1111");
    expect(doc.discriminator).toBe("#1111");
    expect(doc.teamName).toBe("Team A");
    expect(doc.yearLevel).toBe("Year 9");
    expect(doc.difficulty).toBe("highSchool");
    expect(doc.totalPoints).toBe(80);
    expect(doc.challengesCompleted).toBe(1);
    expect(doc.ratingSum).toBe(5);
    expect(doc.ratingCount).toBe(1);
    expect(doc.lastChallengeId).toBe(3);
    expect(doc.lastActivityTitle).toBe("Hand Fan Challenge");
    expect(doc.ownerUid).toBe("uid-abc");
    expect(doc.updatedAt).toBeTruthy();
  });

  it("accumulates totals when existing doc provided", () => {
    const doc = buildLeaderboardFirestoreDoc(result, "uid-abc", {
      totalPoints: 100,
      challengesCompleted: 2,
      ratingSum: 8,
      ratingCount: 2,
      yearLevel: "Year 8",
      difficulty: "primary",
    });

    expect(doc.totalPoints).toBe(180);
    expect(doc.challengesCompleted).toBe(3);
    expect(doc.ratingSum).toBe(13);
    expect(doc.ratingCount).toBe(3);
    expect(doc.yearLevel).toBe("Year 9");
    expect(doc.difficulty).toBe("highSchool");
  });
});
