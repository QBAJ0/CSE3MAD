import { GAMIFICATION, SCORING } from "@/src/config/constants";
import {
  buildChallengePointsBreakdown,
  buildPointsInputFromDraft,
  calculateChallengePoints,
  getChallengeScoringSignals,
  scoreActivityResult,
} from "@/src/services/challengeScoring";
import { ActivityResult, Prototype } from "@/src/types";

function makePrototype(
  index: number,
  measurements: Record<string, string | number>,
): Prototype {
  return {
    index,
    measurements,
    capturedAt: "2026-01-01T00:00:00.000Z",
  };
}

function parachutePrimaryMeasurements(
  extra: Record<string, string | number> = {},
): Record<string, string | number> {
  return {
    designName: "Test chute",
    dropHeightMeters: "1",
    fallTimeSeconds: "2.5",
    ...extra,
  };
}

describe("challengeScoring", () => {
  describe("calculateChallengePoints", () => {
    it("awards base XP only with minimal input", () => {
      const points = calculateChallengePoints({
        prototypeCount: 1,
        predictionChars: 0,
        reflectionChars: 0,
        hasCompleteData: false,
        hasEvidence: false,
        hasTeamwork: false,
        difficulty: "primary",
        completedInTime: true,
      });
      expect(points).toBe(SCORING.BASE_XP);
    });

    it("adds data quality bonus when required measurements are complete", () => {
      const signals = getChallengeScoringSignals({
        challengeId: 1,
        difficulty: "primary",
        prototypes: [makePrototype(1, parachutePrimaryMeasurements())],
      });
      expect(signals.hasCompleteData).toBe(true);

      const points = calculateChallengePoints({
        prototypeCount: 1,
        predictionChars: 0,
        reflectionChars: 0,
        ...signals,
        difficulty: "primary",
        completedInTime: true,
      });
      expect(points).toBe(SCORING.BASE_XP + SCORING.DATA_QUALITY);
    });

    it("adds evidence bonus for GPS location", () => {
      const signals = getChallengeScoringSignals({
        challengeId: 1,
        difficulty: "primary",
        prototypes: [makePrototype(1, parachutePrimaryMeasurements())],
        location: { lat: -37.81, lng: 144.96 },
      });
      expect(signals.hasEvidence).toBe(true);

      const points = calculateChallengePoints({
        prototypeCount: 1,
        predictionChars: 0,
        reflectionChars: 0,
        ...signals,
        difficulty: "primary",
        completedInTime: true,
      });
      expect(points).toBe(
        SCORING.BASE_XP + SCORING.DATA_QUALITY + SCORING.EVIDENCE_BONUS,
      );
    });

    it("does not award evidence when media and location are missing", () => {
      const signals = getChallengeScoringSignals({
        challengeId: 1,
        difficulty: "primary",
        prototypes: [makePrototype(1, parachutePrimaryMeasurements())],
      });
      expect(signals.hasEvidence).toBe(false);
    });

    it("adds reflection bonus above threshold", () => {
      const reflection = "x".repeat(GAMIFICATION.REFLECTION_THRESHOLD_1 + 1);
      const points = calculateChallengePoints({
        prototypeCount: 1,
        predictionChars: 0,
        reflectionChars: reflection.length,
        hasCompleteData: false,
        hasEvidence: false,
        hasTeamwork: false,
        difficulty: "primary",
        completedInTime: true,
      });
      expect(points).toBe(SCORING.BASE_XP + SCORING.REFLECTION_BONUS_1);
    });

    it("adds teamwork bonus when teamResults has multiple entries", () => {
      const signals = getChallengeScoringSignals({
        challengeId: 1,
        difficulty: "primary",
        prototypes: [
          makePrototype(1, {
            ...parachutePrimaryMeasurements(),
            teamResults: JSON.stringify([
              { name: "A", time: 1 },
              { name: "B", time: 2 },
            ]),
          }),
        ],
      });
      expect(signals.hasTeamwork).toBe(true);

      const points = calculateChallengePoints({
        prototypeCount: 1,
        predictionChars: 0,
        reflectionChars: 0,
        ...signals,
        difficulty: "primary",
        completedInTime: true,
      });
      expect(points).toBe(SCORING.BASE_XP + SCORING.DATA_QUALITY + SCORING.TEAMWORK_BONUS);
    });

    it("stacks multi-prototype bonuses for two and three designs", () => {
      const two = calculateChallengePoints({
        prototypeCount: 2,
        predictionChars: 0,
        reflectionChars: 0,
        hasCompleteData: false,
        hasEvidence: false,
        hasTeamwork: false,
        difficulty: "primary",
        completedInTime: true,
      });
      expect(two).toBe(SCORING.BASE_XP + SCORING.MULTI_DESIGN_2);

      const three = calculateChallengePoints({
        prototypeCount: 3,
        predictionChars: 0,
        reflectionChars: 0,
        hasCompleteData: false,
        hasEvidence: false,
        hasTeamwork: false,
        difficulty: "primary",
        completedInTime: true,
      });
      expect(three).toBe(
        SCORING.BASE_XP + SCORING.MULTI_DESIGN_2 + SCORING.MULTI_DESIGN_3,
      );
    });
  });

  describe("preview matches saved result", () => {
    const reflection = "a".repeat(GAMIFICATION.REFLECTION_THRESHOLD_1 + 5);
    const prototypes = [
      makePrototype(1, parachutePrimaryMeasurements()),
      makePrototype(
        2,
        parachutePrimaryMeasurements({ designName: "Design 2" }),
      ),
    ];

    it("aligns breakdown total with calculateChallengePoints", () => {
      const input = buildPointsInputFromDraft({
        challengeId: 1,
        difficulty: "primary",
        prototypes,
        predictionChars: "It will fall slowly".length,
        reflectionChars: reflection.length,
        draftLocation: { lat: -37.81, lng: 144.96 },
        completedInTime: true,
      });
      const { total } = buildChallengePointsBreakdown(input);
      expect(total).toBe(calculateChallengePoints(input));
    });

    it("aligns scoreActivityResult with results preview input", () => {
      const input = buildPointsInputFromDraft({
        challengeId: 1,
        difficulty: "primary",
        prototypes,
        predictionChars: "It will fall slowly".length,
        reflectionChars: reflection.length,
        draftLocation: { lat: -37.81, lng: 144.96 },
        completedInTime: true,
      });
      const previewPoints = calculateChallengePoints(input);

      const baseResult: Omit<ActivityResult, "points"> = {
        id: "test-result-1",
        challengeId: 1,
        teamId: "team-1",
        teamName: "Test Team",
        difficulty: "primary",
        prediction: "It will fall slowly",
        prototypes,
        derivedByPrototype: {},
        rating: 4,
        reflection,
        location: { lat: -37.81, lng: 144.96 },
        createdAt: "2026-01-01T00:00:00.000Z",
        completedInTime: true,
      };

      expect(scoreActivityResult(baseResult, true)).toBe(previewPoints);
    });

    it("applies high school multiplier and time penalty consistently", () => {
      const hsPrototypes = [
        makePrototype(
          1,
          parachutePrimaryMeasurements({
            toyMassKg: "0.05",
            contactTimeSeconds: "0.1",
            bounced: "No",
          }),
        ),
      ];
      const hsInput = buildPointsInputFromDraft({
        challengeId: 1,
        difficulty: "highSchool",
        prototypes: hsPrototypes,
        predictionChars: "Prediction text here".length,
        reflectionChars: reflection.length,
        draftLocation: { lat: -37.81, lng: 144.96 },
        completedInTime: false,
      });
      const hsPreview = calculateChallengePoints(hsInput);
      const hsBreakdown = buildChallengePointsBreakdown(hsInput);
      expect(hsBreakdown.total).toBe(hsPreview);

      const hsResult: Omit<ActivityResult, "points"> = {
        id: "test-result-hs",
        challengeId: 1,
        teamId: "team-1",
        teamName: "Test Team",
        difficulty: "highSchool",
        prediction: "Prediction text here",
        prototypes: hsPrototypes,
        derivedByPrototype: {},
        rating: 5,
        reflection,
        location: { lat: -37.81, lng: 144.96 },
        createdAt: "2026-01-01T00:00:00.000Z",
        completedInTime: false,
      };
      expect(scoreActivityResult(hsResult, false)).toBe(hsPreview);
    });
  });
});
