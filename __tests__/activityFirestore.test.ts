import {
  REQUIRED_ACTIVITY_DOC_FIELDS,
  buildActivityAttempts,
  buildActivityEvidenceFirestore,
  buildActivityFirestoreDoc,
  extractOutcomeValue,
  mergeEvidenceUpload,
  resolveEvidenceUploadStatus,
} from "@/src/services/activityFirestore";
import { ActivityResult } from "@/src/types";

const baseResult: ActivityResult = {
  id: "result-abc",
  challengeId: 2,
  teamId: "#5678",
  teamName: "Lab Rats",
  discriminator: "#5678",
  activityTitle: "Sound Pollution Hunter",
  yearLevel: "Year 7",
  difficulty: "primary",
  prediction: "Stomping will be loudest",
  prototypes: [
    {
      index: 1,
      capturedAt: "2026-06-01T10:00:00.000Z",
      measurements: {
        action: "Stomping",
        soundLevel: 82,
        predictedOutcomeText: "Loudest",
        predictedOutcomeValue: 85,
        wereYouRight: "yes",
      },
    },
  ],
  derivedByPrototype: {},
  rating: 4,
  reflection: "We heard a big difference between walking and stomping.",
  comment: "Fun activity!",
  completedInTime: true,
  points: 120,
  location: { lat: -37.81, lng: 144.96 },
  createdAt: "2026-06-01T10:05:00.000Z",
  updatedAt: "2026-06-01T10:05:01.000Z",
};

describe("activityFirestore", () => {
  it("includes every required top-level Firestore field", () => {
    const doc = buildActivityFirestoreDoc(baseResult, "uid-test");
    for (const key of REQUIRED_ACTIVITY_DOC_FIELDS) {
      expect(doc).toHaveProperty(key);
    }
  });

  it("builds assessment-aligned activity document", () => {
    const doc = buildActivityFirestoreDoc(baseResult, "uid-test");

    expect(doc.resultId).toBe("result-abc");
    expect(doc.activityId).toBe(2);
    expect(doc.challengeId).toBe(2);
    expect(doc.activityTitle).toBe("Sound Pollution Hunter");
    expect(doc.discriminator).toBe("#5678");
    expect(doc.yearLevel).toBe("Year 7");
    expect(doc.difficulty).toBe("primary");
    expect(doc.comment).toBe("Fun activity!");
    expect(doc.leaderboardScore).toBe(120);
    expect(doc.points).toBe(120);
    expect(doc.gpsLat).toBe(-37.81);
    expect(doc.gpsLng).toBe(144.96);
    expect(doc.ownerUid).toBe("uid-test");
  });

  it("builds attempts[] with prediction, outcome, units, and wereYouRight", () => {
    const attempts = buildActivityAttempts(baseResult);

    expect(attempts).toHaveLength(1);
    expect(attempts[0].attemptId).toBe("prototype-1");
    expect(attempts[0].prototypeId).toBe(1);
    expect(attempts[0].attemptName).toBe("Stomping");
    expect(attempts[0].prediction).toBe("Loudest");
    expect(attempts[0].predictionValue).toBe("85");
    expect(attempts[0].outcomeValue).toBe("82");
    expect(attempts[0].unit).toBe("dB");
    expect(attempts[0].wereYouRight).toBe("yes");
    expect(attempts[0].sensorSummary.soundLevel).toBe(82);
    expect(attempts[0].calculations).toEqual({});
  });

  it("saves calculations on attempts for highSchool difficulty", () => {
    const hsResult: ActivityResult = {
      ...baseResult,
      challengeId: 1,
      difficulty: "highSchool",
      derivedByPrototype: {
        1: { finalVelocity: 2.5, gForce: 8 },
      },
      prototypes: [
        {
          index: 1,
          capturedAt: "2026-06-01T10:00:00.000Z",
          measurements: {
            designName: "Plastic canopy",
            fallTimeSeconds: 1.2,
            dropHeightMeters: 1.5,
            wereYouRight: "no",
          },
        },
      ],
    };

    const attempts = buildActivityAttempts(hsResult);
    expect(attempts[0].calculations.finalVelocity).toBe(2.5);
    expect(attempts[0].calculations.gForce).toBe(8);
    expect(attempts[0].derived.finalVelocity).toBe(2.5);
  });

  it("parses reaction board teamResults for outcome text", () => {
    const reactionResult: ActivityResult = {
      ...baseResult,
      challengeId: 6,
      prototypes: [
        {
          index: 1,
          capturedAt: "2026-06-01T10:00:00.000Z",
          measurements: {
            teamResults: JSON.stringify([
              { name: "Ava", dominantTime: 0.31, nonDominantTime: 0.35 },
              { name: "Ben", dominantTime: 0.28, nonDominantTime: 0.33 },
            ]),
            wereYouRight: "no",
          },
        },
      ],
    };

    const attempts = buildActivityAttempts(reactionResult);
    expect(attempts[0].outcome).toContain("0.280");
    expect(attempts[0].wereYouRight).toBe("no");
  });

  it("builds pending evidence files for local media URIs", () => {
    const withMedia: ActivityResult = {
      ...baseResult,
      prototypes: [
        {
          index: 1,
          capturedAt: "2026-06-01T10:00:00.000Z",
          measurements: {
            photoUri: "file:///photo.jpg",
            slowMotionVideo: "file:///video.mp4",
          },
        },
      ],
    };

    const evidence = buildActivityEvidenceFirestore(withMedia, "uid-1");
    expect(evidence.hasPhoto).toBe(true);
    expect(evidence.hasVideo).toBe(true);
    expect(evidence.uploadStatus).toBe("pending");
    expect(evidence.files).toHaveLength(2);
    expect(evidence.files[0].uploadStatus).toBe("pending");
    expect(evidence.files[0].downloadUrl).toBeUndefined();
    expect(evidence.files[0].uploadedAt).toBeUndefined();
    expect(evidence.files[0].storagePath).toContain("activity-evidence/uid-1/");
  });

  it("omits uploadStatus when there is no photo or video", () => {
    const evidence = buildActivityEvidenceFirestore(baseResult, "uid-1");
    expect(evidence.hasVideo).toBe(false);
    expect(evidence.hasPhoto).toBe(false);
    expect(evidence.uploadStatus).toBeUndefined();
    expect(evidence.files).toHaveLength(0);
  });

  it("sets hasGps without media uploadStatus when only location exists", () => {
    const evidence = buildActivityEvidenceFirestore(
      { ...baseResult, location: { lat: -37, lng: 144 } },
      "uid-1",
    );
    expect(evidence.hasGps).toBe(true);
    expect(evidence.uploadStatus).toBeUndefined();
  });

  it("merges upload patch into evidence with download URL", () => {
    const evidence = buildActivityEvidenceFirestore(
      {
        ...baseResult,
        prototypes: [
          {
            index: 1,
            capturedAt: "2026-06-01T10:00:00.000Z",
            measurements: { photoUri: "file:///photo.jpg" },
          },
        ],
      },
      "uid-1",
    );

    const merged = mergeEvidenceUpload(
      evidence,
      {
        prototypeIndex: 1,
        measurementKey: "photoUri",
        localUri: "file:///photo.jpg",
        downloadUrl: "https://storage.example/photo.jpg",
        storagePath:
          "activity-evidence/uid-1/result-abc/prototype-1-photoUri.jpg",
      },
      "2026-06-01T11:00:00.000Z",
    );

    const file = merged.files.find((f) => f.measurementKey === "photoUri");
    expect(file?.uploadStatus).toBe("uploaded");
    expect(file?.downloadUrl).toContain("https://");
    expect(file?.localUri).toBe("file:///photo.jpg");
    expect(file?.storagePath).toContain("activity-evidence/");
    expect(file?.mediaType).toBe("photo");
    expect(file?.uploadedAt).toBe("2026-06-01T11:00:00.000Z");
    expect(merged.uploadStatus).toBe("uploaded");
    expect(merged.photoUris[0]).toContain("https://");
  });

  it("resolveEvidenceUploadStatus stays pending until all files uploaded", () => {
    const pending = buildActivityEvidenceFirestore(
      {
        ...baseResult,
        prototypes: [
          {
            index: 1,
            capturedAt: "2026-06-01T10:00:00.000Z",
            measurements: {
              photoUri: "file:///a.jpg",
              slowMotionVideo: "file:///b.mp4",
            },
          },
        ],
      },
      "uid-1",
    );
    expect(resolveEvidenceUploadStatus(pending.files)).toBe("pending");

    const oneDone = mergeEvidenceUpload(
      pending,
      {
        prototypeIndex: 1,
        measurementKey: "photoUri",
        localUri: "file:///a.jpg",
        downloadUrl: "https://cdn/a.jpg",
        storagePath: "activity-evidence/uid-1/r/prototype-1-photoUri.jpg",
      },
      "2026-06-01T11:00:00.000Z",
    );
    expect(oneDone.uploadStatus).toBe("pending");
  });

  it("extractOutcomeValue returns numeric measurement per challenge", () => {
    expect(
      extractOutcomeValue(2, { soundLevel: 72.5 }),
    ).toBe("72.5");
    expect(
      extractOutcomeValue(3, { bendAngle: 40 }),
    ).toBe("40");
  });
});
