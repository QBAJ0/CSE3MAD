// @author QB

import {
  buildIncompleteSummary,
  getRequiredMeasurements,
  isPrototypeComplete,
} from "@/src/utils/challengeRecordValidation";
import { Measurement, Prototype } from "@/src/types";

const required: Measurement[] = [
  { key: "fallTime", label: "Fall time", recorder: "stopwatch" },
  { key: "location", label: "GPS", recorder: "gps" },
];

const prototype = (measurements: Prototype["measurements"]): Prototype => ({
  index: 1,
  measurements,
  capturedAt: new Date().toISOString(),
});

describe("challengeRecordValidation", () => {
  it("treats GPS and video as optional for completion", () => {
    expect(getRequiredMeasurements(required)).toEqual([required[0]]);
  });

  it("detects missing required fields", () => {
    expect(
      isPrototypeComplete(prototype({ fallTime: 2.1 }), getRequiredMeasurements(required)),
    ).toBe(true);
    expect(
      isPrototypeComplete(prototype({}), getRequiredMeasurements(required)),
    ).toBe(false);
  });

  it("summarises incomplete designs", () => {
    const summary = buildIncompleteSummary(
      [prototype({}), prototype({ fallTime: 1 })],
      getRequiredMeasurements(required),
    );
    expect(summary).toContain("Design #1");
    expect(summary).toContain("Fall time");
  });
});
