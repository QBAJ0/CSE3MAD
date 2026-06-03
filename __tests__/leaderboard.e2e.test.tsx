// @author Queen

// ─── Mock useLeaderboard so renders are deterministic with no Firebase calls ───
const mockUseLeaderboard = jest.fn();
jest.mock("@/src/hooks/useLeaderboard", () => ({
  useLeaderboard: (...args: unknown[]) => mockUseLeaderboard(...args),
}));

// ─── Mock storage (TeamContext reads completed activities) ───────────────────
jest.mock("@/src/utils/storage", () => ({
  storage: {
    getTeam: jest.fn().mockResolvedValue(null),
    getCompletedActivities: jest.fn().mockResolvedValue([]),
    getReminderHour: jest.fn().mockResolvedValue(19),
    getReminderMinute: jest.fn().mockResolvedValue(0),
    getEarnedBadges: jest.fn().mockResolvedValue([]),
    getStreak: jest.fn().mockResolvedValue(0),
    clearAll: jest.fn().mockResolvedValue(undefined),
    clearTeam: jest.fn().mockResolvedValue(undefined),
  },
  DEFAULT_REMINDER_HOUR: 19,
  DEFAULT_REMINDER_MINUTE: 0,
}));

// ─── expo-router: override so useFocusEffect works in test environment ────────
jest.mock("expo-router", () => {
  const React = require("react");
  return {
    router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
    useLocalSearchParams: () => ({}),
    useFocusEffect: (cb: () => void) => React.useEffect(cb, []),
    Link: ({ children }: { children: React.ReactNode }) => children,
    Stack: Object.assign(
      ({ children }: { children: React.ReactNode }) => children,
      { Screen: () => null },
    ),
    Tabs: ({ children }: { children: React.ReactNode }) => children,
  };
});

// ─── expo-battery (used transitively by batteryGuard) ────────────────────────
jest.mock("expo-battery", () => ({
  getBatteryLevelAsync: jest.fn().mockResolvedValue(0.8),
  getBatteryStateAsync: jest.fn().mockResolvedValue(1),
  isLowPowerModeEnabledAsync: jest.fn().mockResolvedValue(false),
  addBatteryLevelListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  addBatteryStateListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  addLowPowerModeListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  BatteryState: { UNKNOWN: 0, UNPLUGGED: 1, CHARGING: 2, FULL: 3 },
}));

import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { TeamProvider } from "@/src/context/TeamContext";
import { ThemeProvider } from "@/src/theme/themeContext";
import type { LeaderboardEntry } from "@/src/types";
import LeaderboardScreen from "../app/(tabs)/leaderboard";

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TeamProvider>{children}</TeamProvider>
    </ThemeProvider>
  );
}

const MOCK_ENTRIES: LeaderboardEntry[] = [
  {
    teamName: "Alpha Squad",
    discriminator: "#0001",
    totalPoints: 300,
    challengesCompleted: 6,
    averageRating: 4.5,
    lastActive: "2026-06-01T10:00:00.000Z",
    rank: 1,
  },
  {
    teamName: "Beta Force",
    discriminator: "#0002",
    totalPoints: 220,
    challengesCompleted: 4,
    averageRating: 4.0,
    lastActive: "2026-06-01T09:00:00.000Z",
    rank: 2,
  },
  {
    teamName: "Gamma Rise",
    discriminator: "#0003",
    totalPoints: 150,
    challengesCompleted: 3,
    averageRating: 3.8,
    lastActive: "2026-05-31T08:00:00.000Z",
    rank: 3,
  },
  {
    teamName: "Delta Lab",
    discriminator: "#0004",
    totalPoints: 90,
    challengesCompleted: 2,
    averageRating: 3.5,
    lastActive: "2026-05-30T07:00:00.000Z",
    rank: 4,
  },
];

describe("LeaderboardScreen (E2E render)", () => {
  jest.setTimeout(15_000);

  beforeEach(() => {
    mockUseLeaderboard.mockReset();
  });

  it("shows a loading spinner while data is being fetched", () => {
    mockUseLeaderboard.mockReturnValue({ entries: [], loading: true });

    const { queryByText } = render(
      <Providers>
        <LeaderboardScreen />
      </Providers>,
    );

    // While loading, the main content is not yet rendered — the screen renders
    // only an ActivityIndicator and does not crash.
    expect(queryByText("Top Scientists")).toBeNull();
    expect(queryByText("No teams yet!")).toBeNull();
  });

  it("shows the empty state when there are no teams", async () => {
    mockUseLeaderboard.mockReturnValue({ entries: [], loading: false });

    const { findByText } = render(
      <Providers>
        <LeaderboardScreen />
      </Providers>,
    );

    expect(await findByText("No teams yet!")).toBeTruthy();
    expect(
      await findByText("Finish your first challenge to get on the board."),
    ).toBeTruthy();
  });

  it("renders header content after loading", async () => {
    mockUseLeaderboard.mockReturnValue({ entries: [], loading: false });

    const { findByText } = render(
      <Providers>
        <LeaderboardScreen />
      </Providers>,
    );

    expect(await findByText("Top Scientists")).toBeTruthy();
  });

  it("renders team names from mock leaderboard data", async () => {
    mockUseLeaderboard.mockReturnValue({ entries: MOCK_ENTRIES, loading: false });

    const { findByText } = render(
      <Providers>
        <LeaderboardScreen />
      </Providers>,
    );

    // Top 3 appear in the podium
    expect(await findByText("Alpha Squad")).toBeTruthy();
    expect(await findByText("Beta Force")).toBeTruthy();
    expect(await findByText("Gamma Rise")).toBeTruthy();

    // Rank 4 appears in the rankings list (ranks 4–10)
    expect(await findByText("Delta Lab")).toBeTruthy();
  });

  it("shows the correct team count in the hero pill", async () => {
    mockUseLeaderboard.mockReturnValue({ entries: MOCK_ENTRIES, loading: false });

    const { findByText } = render(
      <Providers>
        <LeaderboardScreen />
      </Providers>,
    );

    expect(await findByText(`${MOCK_ENTRIES.length} teams`)).toBeTruthy();
  });

  it("does not crash when Firebase is unavailable and leaderboard returns empty", async () => {
    // Simulates the hook gracefully falling back to empty after a Firebase error
    mockUseLeaderboard.mockReturnValue({ entries: [], loading: false });

    const { findByText } = render(
      <Providers>
        <LeaderboardScreen />
      </Providers>,
    );

    // Screen still renders the empty state — no crash
    await waitFor(async () => {
      expect(await findByText("No teams yet!")).toBeTruthy();
    });
  });

  it("renders time-frame filter buttons", async () => {
    mockUseLeaderboard.mockReturnValue({ entries: [], loading: false });

    const { findByText } = render(
      <Providers>
        <LeaderboardScreen />
      </Providers>,
    );

    expect(await findByText("This Week")).toBeTruthy();
    expect(await findByText("This Month")).toBeTruthy();
    expect(await findByText("All Time")).toBeTruthy();
  });
});
