/**
 * Unit tests for the battery guard utility.
 *
 * jest-expo resolves batteryGuard.native.ts (the real logic) because the test
 * environment targets iOS/Android. expo-battery is mocked globally in jest.setup.ts
 * with healthy defaults (75%, low-power off), so individual tests override only
 * what they need to change.
 */

import * as Battery from "expo-battery";
import { checkBatteryGuard } from "@/src/utils/batteryGuard";

const mockBattery = jest.mocked(Battery);

describe("checkBatteryGuard", () => {
  beforeEach(() => {
    // Reset to healthy defaults before each test.
    mockBattery.getBatteryLevelAsync.mockResolvedValue(0.75);
    mockBattery.isLowPowerModeEnabledAsync.mockResolvedValue(false);
  });

  it("returns ok when battery is healthy and low-power mode is off", async () => {
    const result = await checkBatteryGuard();
    expect(result.defer).toBe(false);
    expect(result.reason).toBe("ok");
    expect(result.batteryLevel).toBeCloseTo(0.75);
  });

  it("defers with low_power_mode when Low Power Mode is active", async () => {
    mockBattery.isLowPowerModeEnabledAsync.mockResolvedValue(true);
    const result = await checkBatteryGuard();
    expect(result.defer).toBe(true);
    expect(result.reason).toBe("low_power_mode");
  });

  it("defers with low_battery when level is below 15%", async () => {
    mockBattery.getBatteryLevelAsync.mockResolvedValue(0.12);
    const result = await checkBatteryGuard();
    expect(result.defer).toBe(true);
    expect(result.reason).toBe("low_battery");
    expect(result.batteryLevel).toBeCloseTo(0.12);
  });

  it("defers with critical_battery when level is below 5%", async () => {
    mockBattery.getBatteryLevelAsync.mockResolvedValue(0.04);
    const result = await checkBatteryGuard();
    expect(result.defer).toBe(true);
    expect(result.reason).toBe("critical_battery");
    expect(result.batteryLevel).toBeCloseTo(0.04);
  });

  it("critical_battery takes priority over low_power_mode", async () => {
    mockBattery.getBatteryLevelAsync.mockResolvedValue(0.03);
    mockBattery.isLowPowerModeEnabledAsync.mockResolvedValue(true);
    const result = await checkBatteryGuard();
    expect(result.defer).toBe(true);
    expect(result.reason).toBe("critical_battery");
  });

  it("returns ok and null level when battery API returns -1 (unavailable)", async () => {
    mockBattery.getBatteryLevelAsync.mockResolvedValue(-1);
    const result = await checkBatteryGuard();
    expect(result.defer).toBe(false);
    expect(result.reason).toBe("ok");
    expect(result.batteryLevel).toBeNull();
  });

  it("defers at exactly the low_battery boundary (15%)", async () => {
    // The threshold is level <= 0.15, so 15% triggers a defer (matches iOS/Android system behaviour).
    mockBattery.getBatteryLevelAsync.mockResolvedValue(0.15);
    const result = await checkBatteryGuard();
    expect(result.defer).toBe(true);
    expect(result.reason).toBe("low_battery");
  });

  it("does not defer just above the low_battery boundary (16%)", async () => {
    mockBattery.getBatteryLevelAsync.mockResolvedValue(0.16);
    const result = await checkBatteryGuard();
    expect(result.defer).toBe(false);
    expect(result.reason).toBe("ok");
  });

  it("returns ok (fail-open) when expo-battery API throws", async () => {
    mockBattery.getBatteryLevelAsync.mockRejectedValue(new Error("sensor unavailable"));
    const result = await checkBatteryGuard();
    expect(result.defer).toBe(false);
    expect(result.reason).toBe("ok");
    expect(result.batteryLevel).toBeNull();
  });
});
