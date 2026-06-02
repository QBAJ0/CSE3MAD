// Single source of truth for every magic number / string in the app.
// Import from here; never hardcode these values in components.

export const SCORING = {
  BASE_XP: 100,
  PREDICTION_BONUS: 15,   // +XP for making a testable prediction
  MULTI_DESIGN_2: 25,     // +XP for testing 2+ prototypes
  MULTI_DESIGN_3: 45,     // +XP for testing 3+ prototypes
  DATA_QUALITY: 25,       // +XP for completing the required measurements
  REFLECTION_BONUS_1: 20, // +XP for thoughtful observations/reflection
  REFLECTION_BONUS_2: 15, // extra +XP for stronger reflection
  EVIDENCE_BONUS: 20,     // +XP for GPS, photo, video, or analysis evidence
  TEAMWORK_BONUS: 20,     // +XP for team participation evidence
  GPS_TAGGED: 20,         // Legacy alias kept for older references
  HIGH_SCHOOL_MULTIPLIER: 1.3,
  TIME_PENALTY_MULTIPLIER: 0.8,
} as const;

export const GAMIFICATION = {
  XP_PER_LEVEL: 500,
  MAX_TEAM_MEMBERS: 6,
  MIN_TEAM_MEMBERS: 1,
  PREDICTION_MIN_CHARS: 10,
  OBSERVATION_MIN_CHARS: 5,
  REFLECTION_THRESHOLD_1: 50,   // chars needed for first bonus
  REFLECTION_THRESHOLD_2: 100,  // chars needed for stacked bonus
} as const;

export const TIMING = {
  SPLASH_MS: 2_200,
  ONE_DAY_MS: 86_400_000,
} as const;

export const SOUND_DB_TIERS = [
  { max: 60, color: "#2563EB", label: "< 60 dB  Safe" },
  { max: 85, color: "#F59E0B", label: "60–85 dB  Moderate" },
  { max: 100, color: "#F97316", label: "85–100 dB  Loud" },
  { max: Infinity, color: "#EF4444", label: "> 100 dB  Dangerous" },
] as const;

// App-specific brand palette
export const BRAND = {
  // Core palette requested for a warmer, kid-friendly look
  orangeLuster: "#F97316",   // CTAs, active states, energy moments
  aspiringBlue: "#2563EB",   // progress, information, completion states
  jewelTeal: "#0F766E",      // headers, primary headings, navigation
  caramelPowder: "#FED7AA",  // warm highlights and friendly surfaces
  warmCream: "#FFF7ED",      // screen backgrounds
  deepInk: "#0F172A",        // main body text and dark surfaces

  // Backward-compatible alias from the earlier palette iteration
  persianPlum: "#0F766E",

  // Legacy aliases kept so existing imports stay stable
  payneGray: "#0F766E",
  skyBlue: "#2563EB",
  ghostWhite: "#FFF7ED",
  peach: "#FED7AA",
  ochre: "#F97316",

  // Semantic aliases
  primary: "#F97316",
  primaryLight: "#FED7AA",
  primaryDark: "#0F766E",
  primaryText: "#0F766E",
  bg: "#FFF7ED",

  // Neutral grays (kept for subtle text / borders)
  slate900: "#0F172A",
  slate700: "#334155",
  slate600: "#475569",
  slate500: "#64748B",
  slate400: "#94A3B8",
  slate300: "#CBD5E1",
  slate200: "#E2E8F0",
  slate100: "#F1F5F9",
  slate50: "#F8FAFC",

  // Utility
  white: "#FFFFFF",
  error: "#DC2626",
  errorLight: "#FEE2E2",
  splash: "#0F766E",
} as const;
