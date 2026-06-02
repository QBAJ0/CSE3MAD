import { ActivityResult } from "@/src/types";
import { getChallengeById } from "@/src/data/challenges";

/** Shape stored at Firestore `leaderboard/{teamId}`. */
export type LeaderboardFirestoreDoc = {
  ownerUid: string;
  teamId: string;
  discriminator: string;
  teamName: string;
  yearLevel: string;
  difficulty: ActivityResult["difficulty"];
  totalPoints: number;
  challengesCompleted: number;
  ratingSum: number;
  ratingCount: number;
  lastChallengeId: number;
  lastActivityTitle: string;
  lastActive: string;
  updatedAt: string;
};

export function buildLeaderboardFirestoreDoc(
  result: ActivityResult,
  ownerUid: string,
  existing?: Partial<LeaderboardFirestoreDoc>,
  updatedAt: string = new Date().toISOString(),
): LeaderboardFirestoreDoc {
  const challenge = getChallengeById(result.challengeId);
  const activityTitle =
    result.activityTitle ?? challenge?.title ?? `Challenge ${result.challengeId}`;
  const points = result.points ?? 0;
  const rating = result.rating ?? 0;

  const prevPoints = existing?.totalPoints ?? 0;
  const prevCompleted = existing?.challengesCompleted ?? 0;
  const prevRatingSum = existing?.ratingSum ?? 0;
  const prevRatingCount = existing?.ratingCount ?? 0;

  return {
    ownerUid,
    teamId: result.teamId,
    discriminator: result.discriminator ?? result.teamId,
    teamName: result.teamName,
    yearLevel: result.yearLevel ?? existing?.yearLevel ?? "Unknown",
    difficulty: result.difficulty ?? existing?.difficulty ?? "primary",
    totalPoints: prevPoints + points,
    challengesCompleted: prevCompleted + 1,
    ratingSum: prevRatingSum + rating,
    ratingCount: prevRatingCount + 1,
    lastChallengeId: result.challengeId,
    lastActivityTitle: activityTitle,
    lastActive: result.createdAt,
    updatedAt,
  };
}
