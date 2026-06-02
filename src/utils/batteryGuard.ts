/**
 * Battery guard — web / Jest stub.
 * On native, Metro resolves batteryGuard.native.ts which uses expo-battery.
 * On web and in the Jest test environment this stub always returns "ok",
 * so background sync is never blocked on non-device targets.
 */

export type BatteryGuardResult = {
  defer: boolean;
  /** Why the guard decided to defer (or not). */
  reason: "low_power_mode" | "critical_battery" | "low_battery" | "ok";
  /** Fractional level 0–1, or null when unavailable. */
  batteryLevel: number | null;
};

export async function checkBatteryGuard(): Promise<BatteryGuardResult> {
  return { defer: false, reason: "ok", batteryLevel: null };
}
