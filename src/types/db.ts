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
