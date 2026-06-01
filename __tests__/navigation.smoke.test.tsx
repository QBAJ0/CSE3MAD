// @author QB

import { ActivityProvider } from "@/src/context/ActivityContext";
import { TeamProvider } from "@/src/context/TeamContext";
import { ThemeProvider } from "@/src/theme/themeContext";
import { render } from "@testing-library/react-native";
import React from "react";

function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TeamProvider>
        <ActivityProvider>{children}</ActivityProvider>
      </TeamProvider>
    </ThemeProvider>
  );
}

describe("navigation route smoke", () => {
  it("imports entry and onboarding routes", () => {
    expect(require("../app/index").default).toBeDefined();
    expect(require("../app/(onboarding)/welcome").default).toBeDefined();
    expect(require("../app/(onboarding)/_layout").default).toBeDefined();
  });

  it("imports tabs layout and home", () => {
    expect(require("../app/(tabs)/_layout").default).toBeDefined();
    expect(require("../app/(tabs)/home").default).toBeDefined();
  });

  it("imports challenge flow routes", () => {
    expect(require("../app/challenge/[id]/index").default).toBeDefined();
    expect(require("../app/challenge/[id]/record").default).toBeDefined();
    expect(require("../app/challenge/[id]/results").default).toBeDefined();
  });

  it("imports root layout", () => {
    expect(require("../app/_layout").default).toBeDefined();
  });

  it("renders welcome onboarding screen", async () => {
    const WelcomeScreen = require("../app/(onboarding)/welcome").default;
    const { findAllByText, findByText } = render(
      <AppProviders>
        <WelcomeScreen />
      </AppProviders>,
    );
    expect((await findAllByText("STEMM")).length).toBeGreaterThan(0);
    expect(await findByText("LAB")).toBeTruthy();
  });

  it("renders challenge brief for id 1", async () => {
    const ChallengeBriefScreen = require("../app/challenge/[id]/index").default;
    const { findByText } = render(
      <AppProviders>
        <ChallengeBriefScreen />
      </AppProviders>,
    );
    expect(await findByText(/Start Challenge/i)).toBeTruthy();
  });
});
