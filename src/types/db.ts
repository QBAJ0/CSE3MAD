export type LocalTeam = {
  id: number;
  teamName: string;
  yearLevel: string;
  createdAt: string;
};

export type LocalMember = {
  id: number;
  teamId: number;
  memberName: string;
};

export type TeamWithMembers = {
  team: LocalTeam;
  members: LocalMember[];
};

export type ResultRow = {
  id: number;
  teamId: number;
  activityId: string;
  activityName: string;
  score: number;
  sensorValue: number | null;
  notes: string | null;
  createdAt: string;
};

export type ResultInput = {
  teamId: number;
  activityId: string;
  activityName: string;
  score: number;
  sensorValue?: number | null;
  notes?: string | null;
  createdAt: string;
};

export type LeaderboardRow = {
  rank: number;
  teamId: number;
  teamName: string;
  totalScore: number;
  completedActivityCount: number;
};
