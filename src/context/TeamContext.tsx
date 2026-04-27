import React, { createContext, useContext, useEffect, useState } from "react";
import { TeamData } from "../types";
import { storage } from "../utils/storage";

type NewTeamInput = Pick<TeamData, "teamName" | "discriminator" | "members">;

type TeamContextType = {
  team: TeamData | null;
  setTeamData: (data: NewTeamInput) => Promise<void>;
  updateTeamPoints: (points: number) => Promise<void>;
  clearTeamData: () => Promise<void>;
  loading: boolean;
};

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [team, setTeam] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storage
      .getTeam()
      .then((saved) => { if (saved) setTeam(saved); })
      .catch((e) => console.warn("Failed to load team:", e))
      .finally(() => setLoading(false));
  }, []);

  const setTeamData = async (data: NewTeamInput) => {
    const teamWithDefaults: TeamData = {
      ...data,
      createdAt: new Date().toISOString(),
      totalPoints: 0,
      completedChallenges: [],
    };
    setTeam(teamWithDefaults);
    await storage.saveTeam(teamWithDefaults);
  };

  const updateTeamPoints = async (points: number) => {
    if (!team) return;
    const updated = { ...team, totalPoints: team.totalPoints + points };
    setTeam(updated);
    await storage.saveTeam(updated);
  };

  const clearTeamData = async () => {
    setTeam(null);
    await storage.clearTeam();
  };

  return (
    <TeamContext.Provider
      value={{ team, setTeamData, updateTeamPoints, clearTeamData, loading }}
    >
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (!context) throw new Error("useTeam must be used inside TeamProvider");
  return context;
}
