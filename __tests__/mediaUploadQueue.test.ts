// Use the real implementation — jest.setup.ts mocks this globally for all other tests.
jest.unmock("@/src/services/mediaUploadQueue");
jest.unmock("@/src/services/mediaEvidence");

jest.mock("@/src/services/authSession", () => ({
  ensureFirebaseAuth: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/src/services/activityFirestorePatch", () => ({
  patchActivityEvidenceAfterUpload: jest.fn().mockResolvedValue(true),
}));

jest.mock("@/src/services/mediaUpload", () => ({
  uploadLocalMediaToStorage: jest.fn(),
}));

// ─────────────────────────────────────────────────────────────────────────────

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  enqueueMediaUploadsForResult,
  processPendingMediaUploads,
  _resetInternalStateForTests,
} from "@/src/services/mediaUploadQueue";
import { uploadLocalMediaToStorage } from "@/src/services/mediaUpload";
import { ActivityResult } from "@/src/types";

const mockUpload = uploadLocalMediaToStorage as jest.MockedFunction<
  typeof uploadLocalMediaToStorage
>;

const QUEUE_KEY = "stemm_pending_media_upload";
const DOWNLOAD_URL = "https://firebasestorage.googleapis.com/v0/b/test/o/file.mp4?alt=media";

function makeResult(id: string, prototypes = 1): ActivityResult {
  return {
    id,
    challengeId: 3,
    teamId: "#1000",
    teamName: "Testers",
    difficulty: "primary",
    prediction: "",
    prototypes: Array.from({ length: prototypes }, (_, i) => ({
      index: i + 1,
      capturedAt: "2026-06-02T00:00:00.000Z",
      measurements: { slowMotionVideo: `file:///local/proto${i + 1}.mp4` },
    })),
    rating: 4,
    reflection: "good",
    createdAt: "2026-06-02T00:00:00.000Z",
  };
}

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  _resetInternalStateForTests();
});

// ── enqueue deduplication ─────────────────────────────────────────────────────

describe("enqueueMediaUploadsForResult — duplicate prevention", () => {
  it("adds items on first call", async () => {
    const added = await enqueueMediaUploadsForResult(makeResult("r-add", 2));
    expect(added).toBe(2);
  });

  it("does not re-enqueue the same items on a second call", async () => {
    const result = makeResult("r-dedup");
    await enqueueMediaUploadsForResult(result);
    const added = await enqueueMediaUploadsForResult(result);
    expect(added).toBe(0);
  });

  it("does not re-enqueue an item that already has a downloadUrl in the queue", async () => {
    const result = makeResult("r-durl");
    await enqueueMediaUploadsForResult(result);

    // Simulate a prior successful upload by writing downloadUrl into the persisted queue.
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const queue = JSON.parse(raw as string) as Array<Record<string, unknown>>;
    queue[0].downloadUrl = DOWNLOAD_URL;
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

    const added = await enqueueMediaUploadsForResult(result);
    expect(added).toBe(0);
  });
});

// ── mutex guard ───────────────────────────────────────────────────────────────

describe("processPendingMediaUploads — concurrent call prevention", () => {
  it("skips a second call that starts before the first finishes", async () => {
    await enqueueMediaUploadsForResult(makeResult("r-mutex"));
    mockUpload.mockResolvedValue({ ok: true, downloadUrl: DOWNLOAD_URL });

    // p1 sets _isProcessing = true synchronously, before its first await.
    const p1 = processPendingMediaUploads();
    // p2 sees _isProcessing = true and returns immediately.
    const p2 = processPendingMediaUploads();

    const [r1, r2] = await Promise.all([p1, p2]);

    expect(r1.attempted).toBe(1);
    expect(r1.completed).toBe(1);
    expect(r2.attempted).toBe(0);
    expect(mockUpload).toHaveBeenCalledTimes(1);
  });

  it("allows a new call once the previous processor has finished", async () => {
    const result = makeResult("r-seq");
    await enqueueMediaUploadsForResult(result);

    mockUpload.mockResolvedValueOnce({ ok: true, downloadUrl: DOWNLOAD_URL });
    const r1 = await processPendingMediaUploads();
    expect(r1.completed).toBe(1);

    // Queue is empty now; a fresh call should succeed (0 attempted, not skipped).
    const r2 = await processPendingMediaUploads();
    expect(r2.attempted).toBe(0);
    expect(r2.remaining).toBe(0);
  });
});

// ── in-flight item guard ──────────────────────────────────────────────────────

describe("processPendingMediaUploads — in-flight item guard", () => {
  it("does not upload the same item more than once within one processor run", async () => {
    await enqueueMediaUploadsForResult(makeResult("r-inflight"));
    mockUpload.mockResolvedValue({ ok: true, downloadUrl: DOWNLOAD_URL });

    // Even with high concurrency the single queue item is only uploaded once.
    const r = await processPendingMediaUploads({ concurrency: 4 });

    expect(r.attempted).toBe(1);
    expect(mockUpload).toHaveBeenCalledTimes(1);
  });
});

// ── already-uploaded item not retried ─────────────────────────────────────────

describe("processPendingMediaUploads — already uploaded items", () => {
  it("skips items that already carry a downloadUrl in the queue", async () => {
    await enqueueMediaUploadsForResult(makeResult("r-uploaded"));

    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const queue = JSON.parse(raw as string) as Array<Record<string, unknown>>;
    queue[0].downloadUrl = DOWNLOAD_URL;
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

    const r = await processPendingMediaUploads();

    expect(r.attempted).toBe(0);
    expect(mockUpload).not.toHaveBeenCalled();
  });
});
