import {
  buildHumanPerformanceFields,
  computeMovementUnits,
  computeSmoothnessScore,
  formatOutcomeText,
  formatReflectNumber,
  isHumanPerformancePrototypeComplete,
  MOVEMENT_UNIT_FACTOR,
  parseHumanPerformancePrototype,
  vibrationLabelFromPeak,
} from "@/src/utils/humanPerformance";
import { Prototype } from "@/src/types";

function makePrototype(measurements: Prototype["measurements"]): Prototype {
  return { index: 1, measurements, capturedAt: "2026-01-01T00:00:00.000Z" };
}

// ─── computeSmoothnessScore ───────────────────────────────────────────────────

describe("computeSmoothnessScore", () => {
  it("returns 0 for an empty array", () => {
    expect(computeSmoothnessScore([])).toBe(0);
  });

  it("returns 100 when all velocity changes are zero", () => {
    expect(computeSmoothnessScore([0])).toBe(100);
  });

  it("clamps to 0 when change exceeds 1", () => {
    expect(computeSmoothnessScore([2])).toBe(0);
  });

  it("returns 50 for an average change of 0.5", () => {
    expect(computeSmoothnessScore([0.5])).toBe(50);
  });

  it("averages multiple values correctly", () => {
    // avg = (0.3 + 0.1) / 2 = 0.2 → score = 100 - 20 = 80
    expect(computeSmoothnessScore([0.3, 0.1])).toBe(80);
  });
});

// ─── computeMovementUnits ─────────────────────────────────────────────────────

describe("computeMovementUnits", () => {
  it("multiplies by MOVEMENT_UNIT_FACTOR and rounds to 1 decimal", () => {
    expect(computeMovementUnits(10)).toBe(Number((10 * MOVEMENT_UNIT_FACTOR).toFixed(1)));
  });

  it("returns 0 for zero input", () => {
    expect(computeMovementUnits(0)).toBe(0);
  });

  it("returns 0 for negative input", () => {
    expect(computeMovementUnits(-5)).toBe(0);
  });

  it("returns 0 for non-finite input", () => {
    expect(computeMovementUnits(NaN)).toBe(0);
    expect(computeMovementUnits(Infinity)).toBe(0);
  });

  it("returns correct value for 25", () => {
    expect(computeMovementUnits(25)).toBe(2.5);
  });
});

// ─── vibrationLabelFromPeak ───────────────────────────────────────────────────

describe("vibrationLabelFromPeak", () => {
  it("returns Low below 0.1", () => {
    expect(vibrationLabelFromPeak(0)).toBe("Low");
    expect(vibrationLabelFromPeak(0.05)).toBe("Low");
  });

  it("returns Medium from 0.1 up to but not including 0.2", () => {
    expect(vibrationLabelFromPeak(0.1)).toBe("Medium");
    expect(vibrationLabelFromPeak(0.15)).toBe("Medium");
  });

  it("returns High at 0.2 and above", () => {
    expect(vibrationLabelFromPeak(0.2)).toBe("High");
    expect(vibrationLabelFromPeak(0.5)).toBe("High");
  });
});

// ─── formatOutcomeText ────────────────────────────────────────────────────────

describe("formatOutcomeText", () => {
  it("formats movement units and duration to 1 decimal each", () => {
    expect(formatOutcomeText(2.5, 3.0)).toBe("2.5 movement units in 3.0 seconds");
  });

  it("rounds both values to 1 decimal place", () => {
    expect(formatOutcomeText(1.0, 10.0)).toBe("1.0 movement units in 10.0 seconds");
  });
});

// ─── buildHumanPerformanceFields ─────────────────────────────────────────────

describe("buildHumanPerformanceFields", () => {
  const base = { durationSeconds: 3.1234, totalMagnitudeSum: 10, peakG: 0.15 };

  it("includes all required keys", () => {
    const fields = buildHumanPerformanceFields(base);
    expect(fields).toHaveProperty("durationSeconds");
    expect(fields).toHaveProperty("timeSeconds");
    expect(fields).toHaveProperty("movementUnits");
    expect(fields).toHaveProperty("vibrationData");
    expect(fields).toHaveProperty("vibrationLabel");
    expect(fields).toHaveProperty("outcomeText");
  });

  it("rounds durationSeconds to 2 decimal places", () => {
    const fields = buildHumanPerformanceFields(base);
    expect(fields.durationSeconds).toBe(3.12);
  });

  it("sets vibrationLabel from peakG", () => {
    const fields = buildHumanPerformanceFields(base);
    expect(fields.vibrationLabel).toBe("Medium");
  });

  it("does not include smoothness keys when smoothnessScore is absent", () => {
    const fields = buildHumanPerformanceFields(base);
    expect(fields).not.toHaveProperty("smoothness");
    expect(fields).not.toHaveProperty("smoothnessScore");
  });

  it("includes smoothness keys when smoothnessScore is provided", () => {
    const fields = buildHumanPerformanceFields({ ...base, smoothnessScore: 75 });
    expect(fields.smoothness).toBe(75);
    expect(fields.smoothnessScore).toBe(75);
  });

  it("does not include smoothness keys when smoothnessScore is NaN", () => {
    const fields = buildHumanPerformanceFields({ ...base, smoothnessScore: NaN });
    expect(fields).not.toHaveProperty("smoothness");
  });
});

// ─── isHumanPerformancePrototypeComplete ─────────────────────────────────────

describe("isHumanPerformancePrototypeComplete", () => {
  it("returns true when movementType and outcomeText are present", () => {
    const p = makePrototype({ movementType: "Walk", outcomeText: "1.0 movement units in 3.0 seconds" });
    expect(isHumanPerformancePrototypeComplete(p)).toBe(true);
  });

  it("returns true when movementType and durationSeconds + movementUnits are present", () => {
    const p = makePrototype({ movementType: "Run", durationSeconds: 3, movementUnits: 1.5 });
    expect(isHumanPerformancePrototypeComplete(p)).toBe(true);
  });

  it("returns false when measurements are empty", () => {
    expect(isHumanPerformancePrototypeComplete(makePrototype({}))).toBe(false);
  });

  it("returns false when movementType is missing", () => {
    const p = makePrototype({ outcomeText: "1.0 movement units in 3.0 seconds" });
    expect(isHumanPerformancePrototypeComplete(p)).toBe(false);
  });

  it("returns false when session data is missing", () => {
    const p = makePrototype({ movementType: "Walk" });
    expect(isHumanPerformancePrototypeComplete(p)).toBe(false);
  });
});

// ─── parseHumanPerformancePrototype ──────────────────────────────────────────

describe("parseHumanPerformancePrototype", () => {
  it("parses all fields from a complete prototype", () => {
    const p = makePrototype({
      durationSeconds: 5.5,
      movementUnits: 2.3,
      smoothnessScore: 80,
      vibrationData: 0.12,
      vibrationLabel: "Medium",
      outcomeText: "2.3 movement units in 5.5 seconds",
      movementType: "Jump",
      wereYouRight: "Yes",
      reflectionNotes: "Felt stable",
    });
    const result = parseHumanPerformancePrototype(p);
    expect(result.durationSeconds).toBe(5.5);
    expect(result.movementUnits).toBe(2.3);
    expect(result.smoothnessScore).toBe(80);
    expect(result.vibrationLabel).toBe("Medium");
    expect(result.movementType).toBe("Jump");
    expect(result.wereYouRight).toBe("Yes");
    expect(result.reflectionNotes).toBe("Felt stable");
  });

  it("falls back to timeSeconds when durationSeconds is absent", () => {
    const p = makePrototype({ timeSeconds: "4.0", movementUnits: 1.0 });
    const result = parseHumanPerformancePrototype(p);
    expect(result.durationSeconds).toBe(4.0);
  });

  it("derives vibrationLabel from peakG when label is absent", () => {
    const p = makePrototype({ vibrationData: 0.25 });
    const result = parseHumanPerformancePrototype(p);
    expect(result.vibrationLabel).toBe("High");
  });
});

// ─── formatReflectNumber ─────────────────────────────────────────────────────

describe("formatReflectNumber", () => {
  it("formats to 2 decimal places by default", () => {
    expect(formatReflectNumber(1.5)).toBe("1.50");
  });

  it("returns em dash for NaN", () => {
    expect(formatReflectNumber(NaN)).toBe("—");
  });

  it("returns em dash for Infinity", () => {
    expect(formatReflectNumber(Infinity)).toBe("—");
  });

  it("respects a custom decimal count", () => {
    expect(formatReflectNumber(3.14159, 3)).toBe("3.142");
  });

  it("formats to 0 decimals when specified", () => {
    expect(formatReflectNumber(1.7, 0)).toBe("2");
  });
});
