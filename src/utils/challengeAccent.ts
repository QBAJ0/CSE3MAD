import type { Challenge } from "../types";

/** Light tint suffix used on activity cards, brief hero, and profile badges. */
const TINT_ALPHA = "22";
const BORDER_ALPHA = "55";

export type ChallengeAccent = {
  accent: string;
  tint: string;
  border: string;
};

export function getChallengeAccent(
  challenge: Pick<Challenge, "color">,
): ChallengeAccent {
  const accent = challenge.color;
  return {
    accent,
    tint: `${accent}${TINT_ALPHA}`,
    border: `${accent}${BORDER_ALPHA}`,
  };
}
