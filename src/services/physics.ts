// services/physics.ts
//
// Pure functions only. No React, no side effects.
// All formulas drawn directly from the User Specification.

const G = 9.8; // m/s²

type ParachuteInputs = {
  dropHeightMeters: number;
  fallTimeSeconds: number;
  toyMassKg?: number;
  contactTimeSeconds?: number;
  bounced?: boolean;
  timeToMaxHeightSeconds?: number;
};

export type ParachuteDerived = {
  finalVelocity?: number; // m/s
  acceleration?: number; // m/s²
  netForce?: number; // N
  dragForce?: number; // N
  gForce?: number; // g
};

const isNum = (x: unknown): x is number =>
  typeof x === "number" && Number.isFinite(x);

export function deriveParachute(inputs: ParachuteInputs): ParachuteDerived {
  const out: ParachuteDerived = {};
  const { dropHeightMeters: h, fallTimeSeconds: t } = inputs;

  // Step 3: final velocity = distance / time (initial velocity = 0)
  if (isNum(h) && isNum(t) && t > 0) {
    out.finalVelocity = h / t;
  }

  // Step 4: acceleration = (v_final - v_initial) / t
  if (isNum(out.finalVelocity) && isNum(t) && t > 0) {
    out.acceleration = out.finalVelocity / t;
  }

  // Step 5: net force = m * a
  if (isNum(inputs.toyMassKg) && isNum(out.acceleration)) {
    out.netForce = inputs.toyMassKg * out.acceleration;
  }

  // Step 6: drag = weight - net force
  if (isNum(inputs.toyMassKg) && isNum(out.netForce)) {
    const weight = inputs.toyMassKg * G;
    out.dragForce = weight - out.netForce;
  }

  // G-force on impact
  if (
    isNum(out.finalVelocity) &&
    isNum(inputs.contactTimeSeconds) &&
    inputs.contactTimeSeconds > 0
  ) {
    let deltaV = out.finalVelocity;

    if (inputs.bounced && isNum(inputs.timeToMaxHeightSeconds)) {
      const vUp = G * inputs.timeToMaxHeightSeconds;
      deltaV = out.finalVelocity + vUp;
    }

    out.gForce = deltaV / inputs.contactTimeSeconds / G;
  }

  return out;
}

// Material stiffness coefficients (N/rad) from spec discussion.
const HAND_FAN_K: Record<string, number> = {
  "Thin printer paper": 0.05,
  "Standard card stock": 0.2,
  "Thin cardboard": 0.5,
  "Corrugated cardboard": 2.5,
};

type HandFanInputs = {
  bendAngleDegrees: number;
  material: string;
};

export type HandFanDerived = {
  bendAngleRadians: number;
  stiffnessK: number;
  estimatedForceN: number;
};

export function deriveHandFan(inputs: HandFanInputs): HandFanDerived | null {
  const { bendAngleDegrees, material } = inputs;
  if (!isNum(bendAngleDegrees) || bendAngleDegrees <= 0) return null;
  const k = HAND_FAN_K[material];
  if (k == null) return null;
  const theta = bendAngleDegrees * (Math.PI / 180);
  return { bendAngleRadians: theta, stiffnessK: k, estimatedForceN: k * theta };
}

// Categorise g-force per the spec's injury-risk table.
export function gForceRiskCategory(
  g: number,
): "none" | "minor" | "serious" | "severe" | "lifeThreatening" {
  if (g < 5) return "none";
  if (g < 10) return "minor";
  if (g < 30) return "serious";
  if (g < 50) return "severe";
  return "lifeThreatening";
}
