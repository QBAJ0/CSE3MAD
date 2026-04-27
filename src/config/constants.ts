// Single source of truth for every magic number / string in the app.
// Import from here; never hardcode these values in components.

export const SCORING = {
  BASE_XP: 100,
  MULTI_DESIGN_2: 30,     // +XP for testing 2+ prototypes
  MULTI_DESIGN_3: 50,     // +XP for testing 3+ prototypes
  HIGH_RATING_4: 50,
  HIGH_RATING_5: 25,      // stacked bonus on top of HIGH_RATING_4
  REFLECTION_BONUS: 25,   // applied once at >50 chars, stacked again at >100 chars
  GPS_TAGGED: 20,
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

// App-specific brand palette (separate from the light/dark theme in constants/theme.ts)
export const BRAND = {
  primary: "#22C55E",
  primaryLight: "#DCFCE7",
  primaryDark: "#166534",
  primaryText: "#16A34A",
  ecofccb: "#ECFCCB",
  slate900: "#0F172A",
  slate700: "#334155",
  slate600: "#475569",
  slate500: "#64748B",
  slate400: "#94A3B8",
  slate300: "#CBD5E1",
  slate200: "#E2E8F0",
  slate100: "#F1F5F9",
  slate50: "#F8FAFC",
  white: "#FFFFFF",
  error: "#DC2626",
  errorLight: "#FEE2E2",
  splash: "#0F172A",
  blue100: "#DBEAFE",
  bbf7d0: "#BBF7D0",
  f0fdf4: "#F0FDF4",
} as const;
