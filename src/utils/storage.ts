import AsyncStorage from "@react-native-async-storage/async-storage";
import { TIMING } from "../config/constants";
import { ActivityResult, TeamData } from "../types";

export const STORAGE_KEYS = {
  TEAM_DATA: "stemm_lab_team",
  COMPLETED_ACTIVITIES: "stemm_completed_activities",
  STREAK: "streak",
  LAST_ACTIVE: "last_active",
  EARNED_BADGES: "stemm_earned_badges",
  REMINDER_HOUR: "reminder_hour",
  REMINDER_MINUTE: "reminder_minute",
} as const;

export const DEFAULT_REMINDER_HOUR = 19;
export const DEFAULT_REMINDER_MINUTE = 0;

export const storage = {
  async saveTeam(team: TeamData): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TEAM_DATA, JSON.stringify(team));
    } catch (e) {
      console.error("Failed to save team:", e);
    }
  },

  async getTeam(): Promise<TeamData | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TEAM_DATA);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error("Failed to get team:", e);
      return null;
    }
  },

  async saveCompletedActivity(activity: ActivityResult): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(
        STORAGE_KEYS.COMPLETED_ACTIVITIES,
      );
      const activities: ActivityResult[] = stored ? JSON.parse(stored) : [];
      activities.push(activity);
      await AsyncStorage.setItem(
        STORAGE_KEYS.COMPLETED_ACTIVITIES,
        JSON.stringify(activities),
      );
    } catch (e) {
      console.error("Failed to save activity:", e);
    }
  },

  async getCompletedActivities(): Promise<ActivityResult[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.COMPLETED_ACTIVITIES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to get activities:", e);
      return [];
    }
  },

  async getStreak(): Promise<number> {
    try {
      const streak = await AsyncStorage.getItem(STORAGE_KEYS.STREAK);
      return streak ? parseInt(streak) : 0;
    } catch (e) {
      console.error("Failed to get streak:", e);
      return 0;
    }
  },

  async updateStreak(): Promise<number> {
    try {
      const lastActive = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ACTIVE);
      const today = new Date().toDateString();
      let streak = await this.getStreak();

      if (lastActive === today) return streak;

      const yesterday = new Date(Date.now() - TIMING.ONE_DAY_MS).toDateString();
      if (lastActive === yesterday) {
        streak++;
      } else {
        streak = 1;
      }

      await AsyncStorage.setItem(STORAGE_KEYS.STREAK, streak.toString());
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVE, today);
      return streak;
    } catch (e) {
      console.error("Failed to update streak:", e);
      return 0;
    }
  },

  async getEarnedBadges(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.EARNED_BADGES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to get badges:", e);
      return [];
    }
  },

  async unlockBadges(ids: string[]): Promise<void> {
    try {
      const existing = await this.getEarnedBadges();
      const updated = Array.from(new Set([...existing, ...ids]));
      await AsyncStorage.setItem(
        STORAGE_KEYS.EARNED_BADGES,
        JSON.stringify(updated),
      );
    } catch (e) {
      console.error("Failed to unlock badges:", e);
    }
  },

  async getReminderHour(): Promise<number> {
    try {
      const val = await AsyncStorage.getItem(STORAGE_KEYS.REMINDER_HOUR);
      return val ? parseInt(val) : DEFAULT_REMINDER_HOUR;
    } catch (e) {
      console.error("Failed to get reminder hour:", e);
      return DEFAULT_REMINDER_HOUR;
    }
  },

  async saveReminderHour(hour: number): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REMINDER_HOUR, hour.toString());
    } catch (e) {
      console.error("Failed to save reminder hour:", e);
    }
  },

  async getReminderMinute(): Promise<number> {
    try {
      const val = await AsyncStorage.getItem(STORAGE_KEYS.REMINDER_MINUTE);
      return val ? parseInt(val) : DEFAULT_REMINDER_MINUTE;
    } catch (e) {
      console.error("Failed to get reminder minute:", e);
      return DEFAULT_REMINDER_MINUTE;
    }
  },

  async saveReminderMinute(minute: number): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REMINDER_MINUTE, minute.toString());
    } catch (e) {
      console.error("Failed to save reminder minute:", e);
    }
  },

  async clearTeam(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.TEAM_DATA);
    } catch (e) {
      console.error("Failed to clear team:", e);
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    } catch (e) {
      console.error("Failed to clear storage:", e);
    }
  },
};
