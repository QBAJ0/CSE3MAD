// Single source of truth for every magic number / string in the app.
// Import from here; never hardcode these values in components.

export const SCORING = {
  BASE_XP: 100,
  MULTI_DESIGN_2: 30,     // +XP for testing 2+ prototypes
  MULTI_DESIGN_3: 50,     // +XP for testing 3+ prototypes
  DATA_QUALITY: 25,       // +XP for completing the required measurements
  REFLECTION_BONUS: 25,   // +XP for thoughtful observations/reflection
  EVIDENCE_BONUS: 20,     // +XP for GPS, photo, video, or analysis evidence
  TEAMWORK_BONUS: 20,     // +XP for team participation evidence
  GPS_TAGGED: 20,         // Legacy alias kept for older references
  HIGH_SCHOOL_MULTIPLIER: 1.5,
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
  { max: 60, color: "#2F80ED", label: "< 60 dB  Safe" },
  { max: 85, color: "#F6B84A", label: "60–85 dB  Moderate" },
  { max: 100, color: "#F97316", label: "85–100 dB  Loud" },
  { max: Infinity, color: "#EF4444", label: "> 100 dB  Dangerous" },
] as const;

// App-specific brand palette
export const BRAND = {
  // Core palette requested for a warmer, kid-friendly look
  orangeLuster: "#F28C28",   // CTAs, active states, energy moments
  aspiringBlue: "#2F80ED",   // progress, information, completion states
  jewelTeal: "#007C7A",      // headers, primary headings, navigation
  caramelPowder: "#F6D7A8",  // warm highlights and friendly surfaces
  warmCream: "#FFF5E8",      // screen backgrounds
  deepInk: "#12343B",        // main body text and dark surfaces

  // Backward-compatible alias from the earlier palette iteration
  persianPlum: "#007C7A",

  // Legacy aliases kept so existing imports stay stable
  payneGray: "#007C7A",
  skyBlue: "#2F80ED",
  ghostWhite: "#FFF5E8",
  peach: "#F6D7A8",
  ochre: "#F28C28",

  // Semantic aliases
  primary: "#F28C28",
  primaryLight: "#F6D7A8",
  primaryDark: "#007C7A",
  primaryText: "#007C7A",
  bg: "#FFF5E8",

  // Neutral grays (kept for subtle text / borders)
  slate900: "#12343B",
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
  splash: "#007C7A",
} as const;
