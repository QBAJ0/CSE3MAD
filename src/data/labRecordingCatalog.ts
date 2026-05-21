/**
 * Lab-only catalog for quick SQLite result capture (`/activity/[id]`).
 * Main XP challenges, badges, and full metadata live in `challenges.ts`.
 */

export type LabRecordingActivity = {
  id: string;
  title: string;
  category: string;
  shortDescription: string;
  measurementLabel: string;
  scoreHint: string;
};

export const LAB_RECORDING_ACTIVITIES: LabRecordingActivity[] = [
  {
    id: "parachute-drop",
    title: "Parachute Drop Challenge",
    category: "Physics / Engineering",
    shortDescription:
      "Design and test a parachute so a payload descends slowly and lands safely.",
    measurementLabel: "Descent time (seconds)",
    scoreHint: "Longer stable descent usually means a higher score.",
  },
  {
    id: "sound-pollution-hunter",
    title: "Sound Pollution Hunter",
    category: "Environmental science",
    shortDescription:
      "Measure noise levels in different zones and compare readings to a safe baseline.",
    measurementLabel: "Sound level (dB or your device scale)",
    scoreHint: "Use your sensor reading as the main numeric result.",
  },
  {
    id: "hand-fan",
    title: "Hand Fan Challenge",
    category: "Physics / air movement",
    shortDescription:
      "Compare fan designs, material stiffness, and distance by measuring bend angle.",
    measurementLabel: "Bend angle (degrees)",
    scoreHint: "Use the bend angle or estimated force as the main numeric result.",
  },
  {
    id: "earthquake-structure",
    title: "Earthquake-Resistant Structure",
    category: "Engineering / earth science",
    shortDescription:
      "Build and test structures that reduce phone movement during simulated vibration.",
    measurementLabel: "Movement distance or vibration reading",
    scoreHint: "Lower movement usually means the structure resisted vibration better.",
  },
  {
    id: "human-performance-lab",
    title: "Human Performance Lab",
    category: "Medical science / biomechanics",
    shortDescription:
      "Measure movement speed, smoothness, and coordination during controlled stretches.",
    measurementLabel: "Smoothness score or completion time",
    scoreHint: "Higher smoothness and controlled movement usually indicate better performance.",
  },
  {
    id: "reaction-board",
    title: "Reaction Board Challenge",
    category: "Human biology / timing",
    shortDescription:
      "Test reaction speed when a signal appears and record consistent trials.",
    measurementLabel: "Reaction time (ms)",
    scoreHint:
      "Lower reaction time can be scored as higher points if you invert in scoring.",
  },
  {
    id: "breathing-trainer",
    title: "Breathing Pace Trainer",
    category: "Medical science",
    shortDescription:
      "Compare breathing rate at rest and after exercise using phone sensor readings.",
    measurementLabel: "Breaths per minute",
    scoreHint: "Record each condition separately so teams can compare rest and exercise.",
  },
];

export function getLabRecordingActivityById(
  id: string,
): LabRecordingActivity | undefined {
  return LAB_RECORDING_ACTIVITIES.find((c) => c.id === id);
}
