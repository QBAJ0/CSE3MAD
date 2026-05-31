// expo-battery is used by BatteryStatusCard.native.tsx — mock listeners so .remove() exists.
jest.mock("expo-battery", () => ({
  getBatteryLevelAsync: jest.fn().mockResolvedValue(0.75),
  getBatteryStateAsync: jest.fn().mockResolvedValue(1),
  isLowPowerModeEnabledAsync: jest.fn().mockResolvedValue(false),
  addBatteryLevelListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  addBatteryStateListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  addLowPowerModeListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  BatteryState: { UNKNOWN: 0, UNPLUGGED: 1, CHARGING: 2, FULL: 3 },
}));

// Override expo-router to add useFocusEffect, which is missing from the global mock.
// Implemented as useEffect so the data-load callback runs after mount, not during render.
jest.mock("expo-router", () => {
  const React = require("react");
  return {
    router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
    useLocalSearchParams: () => ({ id: "1" }),
    useFocusEffect: (cb: () => void) => React.useEffect(cb, []),
    Link: ({ children }: { children: React.ReactNode }) => children,
    Stack: Object.assign(
      ({ children }: { children: React.ReactNode }) => children,
      { Screen: () => null },
    ),
    Tabs: ({ children }: { children: React.ReactNode }) => children,
  };
});

import React from "react";
import { render } from "@testing-library/react-native";
import { TeamProvider } from "@/src/context/TeamContext";
import { ThemeProvider } from "@/src/theme/themeContext";
import ProfileScreen from "../app/(tabs)/profile";

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TeamProvider>{children}</TeamProvider>
    </ThemeProvider>
  );
}

describe("ProfileScreen (E2E render)", () => {
  it("renders and shows profile sections after loading", async () => {
    const { findByText } = render(
      <Providers>
        <ProfileScreen />
      </Providers>
    );

    // Default team name shown when no team is stored
    expect(await findByText("My Team")).toBeTruthy();

    // Section headings visible once loading resolves
    expect(await findByText("Preferences")).toBeTruthy();
    expect(await findByText("Team Members")).toBeTruthy();
    expect(await findByText("Your Badges")).toBeTruthy();
    expect(await findByText("Past Experiments")).toBeTruthy();
  });
});
