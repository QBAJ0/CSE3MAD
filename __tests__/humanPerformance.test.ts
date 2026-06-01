import {
  computeMovementUnits,
  computeSmoothnessScore,
  formatOutcomeText,
  formatReflectNumber,
  isHumanPerformancePrototypeComplete,
  vibrationLabelFromPeak,
} from "@/src/utils/humanPerformance";
import { Prototype } from "@/src/types";

function makePrototype(measurements: Prototype["measurements"]): Prototype {
  return { index: 1, measurements, capturedAt: "2026-01-01T00:00:00.000Z" };
}

describe("computeSmoothnessScore", () => {
  it("returns 0 for empty input", () => {
    expect(computeSmoothnessScore([])).toBe(0);
  });

  it("returns 100 when there is no velocity change", () => {
    expect(computeSmoothnessScore([0])).toBe(100);
  });

  it("calculates the average across multiple values", () => {
    // avg = (0.3 + 0.1) / 2 = 0.2, score = 100 - 20 = 80
    expect(computeSmoothnessScore([0.3, 0.1])).toBe(80);
  });
});

describe("computeMovementUnits", () => {
  it("returns the correct movement units for a normal value", () => {
    expect(computeMovementUnits(25)).toBe(2.5);
  });

  it("returns 0 for zero input", () => {
    expect(computeMovementUnits(0)).toBe(0);
  });

  it("returns 0 for negative input", () => {
    expect(computeMovementUnits(-5)).toBe(0);
  });
});

describe("vibrationLabelFromPeak", () => {
  it("returns Low for small peak values", () => {
    expect(vibrationLabelFromPeak(0.05)).toBe("Low");
  });

  it("returns Medium for mid range values", () => {
    expect(vibrationLabelFromPeak(0.15)).toBe("Medium");
  });

  it("returns High for large peak values", () => {
    expect(vibrationLabelFromPeak(0.3)).toBe("High");
  });
});

describe("formatOutcomeText", () => {
  it("formats the result string correctly", () => {
    expect(formatOutcomeText(2.5, 3.0)).toBe("2.5 movement units in 3.0 seconds");
  });
});

describe("isHumanPerformancePrototypeComplete", () => {
  it("returns true when all required fields are present", () => {
    const p = makePrototype({ movementType: "Walk", outcomeText: "1.0 movement units in 3.0 seconds" });
    expect(isHumanPerformancePrototypeComplete(p)).toBe(true);
  });

  it("returns false when movementType is missing", () => {
    const p = makePrototype({ outcomeText: "1.0 movement units in 3.0 seconds" });
    expect(isHumanPerformancePrototypeComplete(p)).toBe(false);
  });

  it("returns false when measurements are empty", () => {
    expect(isHumanPerformancePrototypeComplete(makePrototype({}))).toBe(false);
  });
});

describe("formatReflectNumber", () => {
  it("formats a number to 2 decimal places by default", () => {
    expect(formatReflectNumber(1.5)).toBe("1.50");
  });

  it("returns a dash for invalid numbers", () => {
    expect(formatReflectNumber(NaN)).toBe("—");
  });
});
