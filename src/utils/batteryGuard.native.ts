/**
 * Battery guard — native implementation (iOS / Android).
 * Metro resolves this file instead of batteryGuard.ts on device builds.
 *
 * Thresholds:
 *   < 5%  → critical_battery  — defer all background work
 *   < 15% → low_battery       — defer background work
 *   lowPowerMode active        — defer background work (regardless of level)
 *   otherwise                  — ok, proceed normally
 *
 * Only background/retry processors are gated.
 * The immediate post-claim sync (syncChallengeResultToCloud) is never battery-gated.
 */

import * as Battery from "expo-battery";
import type { BatteryGuardResult } from "./batteryGuard";

export type { BatteryGuardResult };

const CRITICAL_LEVEL = 0.05; // 5%
const LOW_LEVEL = 0.15; // 15%

export async function checkBatteryGuard(): Promise<BatteryGuardResult> {
  try {
    const [level, lowPowerMode] = await Promise.all([
      Battery.getBatteryLevelAsync(),
      Battery.isLowPowerModeEnabledAsync(),
    ]);

    // expo-battery returns -1 when level is unavailable (some Android devices).
    const safeLevel = level === -1 ? null : level;

    if (safeLevel !== null && safeLevel <= CRITICAL_LEVEL) {
      return { defer: true, reason: "critical_battery", batteryLevel: safeLevel };
    }
    if (lowPowerMode) {
      return { defer: true, reason: "low_power_mode", batteryLevel: safeLevel };
    }
    if (safeLevel !== null && safeLevel <= LOW_LEVEL) {
      return { defer: true, reason: "low_battery", batteryLevel: safeLevel };
    }

    return { defer: false, reason: "ok", batteryLevel: safeLevel };
  } catch {
    // If the battery API is unavailable (e.g. simulator without battery info),
    // do not block background work — fail open.
    return { defer: false, reason: "ok", batteryLevel: null };
  }
}
