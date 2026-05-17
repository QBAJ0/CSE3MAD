import { CHALLENGES } from "../data/challenges";
import { ActivityResult, Challenge, TeamData } from "../types";

export function getTeamActivities(
  activities: ActivityResult[],
  team?: TeamData | null,
): ActivityResult[] {
  if (!team) return activities;
  return activities.filter((activity) => activity.teamId === team.discriminator);
}

export function hasCompletedActivityToday(activities: ActivityResult[]): boolean {
  const today = new Date().toDateString();
  return activities.some(
    (activity) => new Date(activity.createdAt).toDateString() === today,
  );
}

export function getNextDailyChallenge(
  activities: ActivityResult[],
): Challenge | undefined {
  const completedIds = new Set(activities.map((activity) => activity.challengeId));
  return CHALLENGES.find((challenge) => !completedIds.has(challenge.id));
}
