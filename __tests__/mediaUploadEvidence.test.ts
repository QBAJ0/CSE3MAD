import {
  buildActivityEvidenceFirestore,
  mergeEvidenceUpload,
} from "@/src/services/activityFirestore";
import { patchActivityEvidenceAfterUpload } from "@/src/services/activityFirestorePatch";
import { ActivityResult } from "@/src/types";

jest.mock("@/src/firebase", () => ({
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(() => ({})),
  getDoc: jest.fn(),
  setDoc: jest.fn().mockResolvedValue(undefined),
}));

const resultWithPhoto: ActivityResult = {
  id: "result-media-1",
  challengeId: 3,
  teamId: "#1000",
  teamName: "Testers",
  difficulty: "primary",
  prediction: "",
  prototypes: [
    {
      index: 1,
      capturedAt: "2026-06-01T10:00:00.000Z",
      measurements: { photoUri: "file:///local/shot.jpg" },
    },
  ],
  rating: 5,
  reflection: "Done",
  createdAt: "2026-06-01T10:00:00.000Z",
};

describe("media evidence Firestore mapping", () => {
  it("pending claim evidence includes required file fields without downloadUrl", () => {
    const evidence = buildActivityEvidenceFirestore(resultWithPhoto, "uid-abc");
    const file = evidence.files[0];

    expect(evidence.hasPhoto).toBe(true);
    expect(evidence.uploadStatus).toBe("pending");
    expect(file.localUri).toBe("file:///local/shot.jpg");
    expect(file.storagePath).toContain("activity-evidence/uid-abc/");
    expect(file.mediaType).toBe("photo");
    expect(file.uploadStatus).toBe("pending");
    expect(file.downloadUrl).toBeUndefined();
  });

  it("patchActivityEvidenceAfterUpload merges only evidence and updatedAt", async () => {
    const { getDoc, setDoc } = jest.requireMock("firebase/firestore");
    const initial = buildActivityEvidenceFirestore(resultWithPhoto, "uid-abc");

    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        evidence: initial,
      }),
    });

    const ok = await patchActivityEvidenceAfterUpload("result-media-1", {
      prototypeIndex: 1,
      measurementKey: "photoUri",
      localUri: "file:///local/shot.jpg",
      downloadUrl: "https://firebasestorage.googleapis.com/shot.jpg",
      storagePath: "activity-evidence/uid-abc/result-media-1/prototype-1-photoUri.jpg",
      uploadedAt: "2026-06-01T12:00:00.000Z",
    });

    expect(ok).toBe(true);
    expect(setDoc).toHaveBeenCalledTimes(1);
    const [, payload, options] = setDoc.mock.calls[0];
    expect(options).toEqual({ merge: true });
    expect(payload).toEqual({
      updatedAt: "2026-06-01T12:00:00.000Z",
      evidence: expect.objectContaining({
        uploadStatus: "uploaded",
        files: [
          expect.objectContaining({
            downloadUrl: "https://firebasestorage.googleapis.com/shot.jpg",
            uploadStatus: "uploaded",
            uploadedAt: "2026-06-01T12:00:00.000Z",
          }),
        ],
      }),
    });
    expect(payload).not.toHaveProperty("rating");
    expect(payload).not.toHaveProperty("teamName");
  });

  it("mergeEvidenceUpload preserves localUri after upload", () => {
    const pending = buildActivityEvidenceFirestore(resultWithPhoto, "uid-abc");
    const merged = mergeEvidenceUpload(
      pending,
      {
        prototypeIndex: 1,
        measurementKey: "photoUri",
        localUri: "file:///local/shot.jpg",
        downloadUrl: "https://cdn.example/shot.jpg",
        storagePath: "activity-evidence/uid-abc/result-media-1/prototype-1-photoUri.jpg",
      },
      "2026-06-01T12:00:00.000Z",
    );

    expect(merged.files[0].localUri).toBe("file:///local/shot.jpg");
    expect(merged.files[0].downloadUrl).toBe("https://cdn.example/shot.jpg");
  });
});
