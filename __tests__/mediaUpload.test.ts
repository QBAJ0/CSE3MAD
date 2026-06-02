import { uploadLocalMediaToStorage } from "@/src/services/mediaUpload";

// ── firebase mocks ────────────────────────────────────────────────────────────
jest.mock("@/src/firebase", () => ({
  isFirebaseStorageReady: true,
  storage: {},
}));

jest.mock("firebase/storage", () => ({
  ref: jest.fn(() => ({ _path: "mock-ref" })),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

// ── expo-file-system/legacy mock ──────────────────────────────────────────────
jest.mock("expo-file-system/legacy", () => ({
  getInfoAsync: jest.fn(),
}));

// ── global fetch mock ─────────────────────────────────────────────────────────
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

// ─────────────────────────────────────────────────────────────────────────────

const LOCAL_URI = "file:///data/user/0/com.test/shot.jpg";
const STORAGE_PATH = "activity-evidence/uid-1/result-1/prototype-0-photoUri.jpg";
const DOWNLOAD_URL = "https://firebasestorage.googleapis.com/v0/b/test/o/shot.jpg?alt=media";

function fs() {
  return jest.requireMock<{ getInfoAsync: jest.Mock }>("expo-file-system/legacy");
}
function firebaseStorage() {
  return jest.requireMock<{
    ref: jest.Mock;
    uploadBytes: jest.Mock;
    getDownloadURL: jest.Mock;
  }>("firebase/storage");
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockReset();
});

describe("uploadLocalMediaToStorage", () => {
  it("returns file_missing when getInfoAsync reports exists=false", async () => {
    fs().getInfoAsync.mockResolvedValueOnce({ exists: false });

    const result = await uploadLocalMediaToStorage(LOCAL_URI, STORAGE_PATH);

    expect(result).toEqual({ ok: false, reason: "file_missing" });
    expect(fs().getInfoAsync).toHaveBeenCalledWith(LOCAL_URI);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns upload_failed when fetch returns !ok", async () => {
    fs().getInfoAsync.mockResolvedValueOnce({ exists: true, size: 1024 });
    mockFetch.mockResolvedValueOnce({ ok: false });

    const result = await uploadLocalMediaToStorage(LOCAL_URI, STORAGE_PATH);

    expect(result).toEqual({ ok: false, reason: "upload_failed" });
    expect(firebaseStorage().uploadBytes).not.toHaveBeenCalled();
  });

  it("uploads blob and returns downloadUrl on success", async () => {
    const fakeBlob = new Blob(["data"], { type: "image/jpeg" });
    fs().getInfoAsync.mockResolvedValueOnce({ exists: true, size: 1024 });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(fakeBlob),
    });
    firebaseStorage().uploadBytes.mockResolvedValueOnce(undefined);
    firebaseStorage().getDownloadURL.mockResolvedValueOnce(DOWNLOAD_URL);

    const result = await uploadLocalMediaToStorage(LOCAL_URI, STORAGE_PATH);

    expect(result).toEqual({ ok: true, downloadUrl: DOWNLOAD_URL });
    expect(firebaseStorage().ref).toHaveBeenCalledWith(expect.anything(), STORAGE_PATH);
    expect(firebaseStorage().uploadBytes).toHaveBeenCalledWith(
      expect.anything(),
      fakeBlob,
    );
    expect(firebaseStorage().getDownloadURL).toHaveBeenCalled();
  });

  it("returns upload_failed and never throws when getInfoAsync throws (SDK 54 regression guard)", async () => {
    // This test guards against accidentally reverting to the non-legacy import.
    // With the old `expo-file-system` import in SDK 54, getInfoAsync throws:
    //   Error: Method getInfoAsync imported from "expo-file-system" is deprecated.
    fs().getInfoAsync.mockRejectedValueOnce(
      new Error(
        'Method getInfoAsync imported from "expo-file-system" is deprecated.',
      ),
    );

    const result = await uploadLocalMediaToStorage(LOCAL_URI, STORAGE_PATH);

    expect(result).toEqual({ ok: false, reason: "upload_failed" });
  });
});
