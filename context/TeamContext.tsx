import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

type TeamMember = {
  name: string;
  year: string;
};

type TeamData = {
  teamName: string;
  discriminator: string;
  members: TeamMember[];
};

type TeamContextType = {
  team: TeamData | null;
  setTeamData: (data: TeamData) => Promise<void>;
  clearTeamData: () => Promise<void>;
  loading: boolean;
};

const TeamContext = createContext<TeamContextType | undefined>(undefined);

const STORAGE_KEY = "stemm_lab_team";

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [team, setTeam] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTeam(JSON.parse(stored));
      }
    } catch (error) {
      console.log("Failed to load team data:", error);
    } finally {
      setLoading(false);
    }
  };

  const setTeamData = async (data: TeamData) => {
    try {
      setTeam(data);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.log("Failed to save team data:", error);
    }
  };

  const clearTeamData = async () => {
    try {
      setTeam(null);
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.log("Failed to clear team data:", error);
    }
  };

  return (
    <TeamContext.Provider value={{ team, setTeamData, clearTeamData, loading }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error("useTeam must be used inside TeamProvider");
  }
  return context;
}
