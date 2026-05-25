import { buildMediaStoragePath } from "@/src/services/mediaEvidence";

describe("buildMediaStoragePath", () => {
  it("uses activity-evidence path aligned with storage.rules", () => {
    const path = buildMediaStoragePath(
      {
        resultId: "draft-abc",
        challengeId: 1,
        teamId: "#1234",
        prototypeIndex: 2,
        measurementKey: "dropVideo",
        localUri: "file:///data/video.mp4",
      },
      "anon-user-uid",
    );

    expect(path).toBe(
      "activity-evidence/anon-user-uid/draft-abc/prototype-2-dropVideo.mp4",
    );
    expect(path).not.toMatch(/^teams\//);
  });
});
