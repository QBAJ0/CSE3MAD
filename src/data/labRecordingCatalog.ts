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
    id: "reaction-board",
    title: "Reaction Board Challenge",
    category: "Human biology / timing",
    shortDescription:
      "Test reaction speed when a signal appears and record consistent trials.",
    measurementLabel: "Reaction time (ms)",
    scoreHint:
      "Lower reaction time can be scored as higher points if you invert in scoring.",
  },
];

export function getLabRecordingActivityById(
  id: string,
): LabRecordingActivity | undefined {
  return LAB_RECORDING_ACTIVITIES.find((c) => c.id === id);
}
