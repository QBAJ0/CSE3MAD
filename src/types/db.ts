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

/** Local STEMM challenge submission (main `/challenge` flow). */
export type ChallengeResultRow = {
  resultId: string;
  sqliteTeamId: number;
  teamDiscriminator: string;
  challengeId: number;
  teamName: string;
  points: number;
  payloadJson: string;
  createdAt: string;
};

export type ChallengeResultInput = {
  resultId: string;
  sqliteTeamId: number;
  teamDiscriminator: string;
  challengeId: number;
  teamName: string;
  points: number;
  payloadJson: string;
  createdAt: string;
};

