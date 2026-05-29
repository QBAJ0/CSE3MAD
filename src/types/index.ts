export type DifficultyMode = "primary" | "highSchool";

export type TeamMember = {
  name: string;
  grade?: string;
};

export type TeamData = {
  teamName: string;
  discriminator: string;
  members: TeamMember[];
  createdAt: string;
  totalPoints: number;
  completedChallenges: number[];
};

export type Prototype = {
  index: number;
  measurements: Record<string, string | number>;
  capturedAt: string;
};

export type Measurement = {
  key: string;
  label: string;
  unit?: string;
  recorder:
    | "manualText"
    | "manualNumber"
    | "manualChoice"
    | "stopwatch"
    | "gps"
    | "video"
    | "videoAnalyzer"
    | "soundMeter"
    | "accelerometer"
    | "breathing"
    | "teamBreathing"
    | "tapReaction"
    | "teamReaction"
    | "gyroscope"
    | "slowMotion"
    | "photo"
    | "tracing";
  choices?: string[];
  placeholder?: string;
  difficulty?: DifficultyMode;
  vibrate?: boolean;
  optional?: boolean;
};

export type DerivedMetric = {
  key: string;
  label: string;
  unit: string;
  formula?: string;
  difficulty?: DifficultyMode;
};

export type ThingsToKnowCard = {
  heading: string;
  color: string;
  bullets: string[];
};

export type Challenge = {
  id: number;
  title: string;
  category: string;
  icon: string;
  color: string;
  shortDescription: string;
  overview: string;
  equipment: string[];
  instructions: string[];
  features: string[];
  maxPrototypes: number;
  estimatedMinutes: number;
  difficultyLevels: DifficultyMode[];
  measurements: Measurement[];
  derivedMetrics?: DerivedMetric[];
  curriculumLinks: string[];
  thingsToKnow?: ThingsToKnowCard[];
  observationQuestions?: string[];
  predictionPrompt?: string;
  extensionTip?: string;
  setupImage?: number;
  discussion?: string;
};

export type ActivityResult = {
  id: string;
  challengeId: number;
  teamId: string;
  teamName: string;
  difficulty: DifficultyMode;
  prediction: string;
  prototypes: Prototype[];
  derivedByPrototype?: Record<number, Record<string, number>>;
  rating: number;
  reflection: string;
  location?: { lat: number; lng: number };
  points?: number;
  completedInTime?: boolean;
  createdAt: string;
};

export type CompletedActivity = ActivityResult;

export type LeaderboardEntry = {
  teamName: string;
  discriminator: string;
  totalPoints: number;
  challengesCompleted: number;
  averageRating: number;
  lastActive: string;
  rank: number;
};

export type SoundMapPoint = {
  id: string;
  label: string;
  db: number;
  latitude: number;
  longitude: number;
};
