import AsyncStorage from "@react-native-async-storage/async-storage";
import { TIMING } from "@/src/config/constants";
import { storage, STORAGE_KEYS } from "@/src/utils/storage";

function dateStringDaysAgo(days: number): string {
  return new Date(Date.now() - days * TIMING.ONE_DAY_MS).toDateString();
}

beforeEach(async () => {
  await storage.clearAll();
});

// ─── Streak logic ─────────────────────────────────────────────────────────────

describe("storage — streak", () => {
  it("increments streak when last active was yesterday", async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.STREAK, "3");
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVE, dateStringDaysAgo(1));

    const result = await storage.updateStreak();

    expect(result).toBe(4);
    expect(await storage.getStreak()).toBe(4);
  });

  it("does not increment streak when called twice on the same day", async () => {
    const first = await storage.updateStreak();
    const second = await storage.updateStreak();

    expect(second).toBe(first);
    expect(await storage.getStreak()).toBe(first);
  });

  it("resets streak to 1 after a gap of two or more days", async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.STREAK, "5");
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVE, dateStringDaysAgo(2));

    const result = await storage.updateStreak();

    expect(result).toBe(1);
    expect(await storage.getStreak()).toBe(1);
  });
});
