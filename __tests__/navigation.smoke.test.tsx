import React from "react";
import { render } from "@testing-library/react-native";
import { ActivityProvider } from "@/src/context/ActivityContext";
import { TeamProvider } from "@/src/context/TeamContext";

function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <TeamProvider>
      <ActivityProvider>{children}</ActivityProvider>
    </TeamProvider>
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
    expect(require("../app/challenge/[id]/details").default).toBeDefined();
  });

  it("imports root layout", () => {
    expect(require("../app/_layout").default).toBeDefined();
  });

  it("renders welcome onboarding screen", () => {
    const WelcomeScreen = require("../app/(onboarding)/welcome").default;
    const { getAllByText, getByText } = render(<WelcomeScreen />);
    expect(getAllByText("STEMM").length).toBeGreaterThan(0);
    expect(getByText("LAB")).toBeTruthy();
  });

  it("renders challenge brief for id 1", async () => {
    const ChallengeBriefScreen =
      require("../app/challenge/[id]/index").default;
    const { findByText } = render(
      <AppProviders>
        <ChallengeBriefScreen />
      </AppProviders>,
    );
    expect(await findByText(/Start Challenge/i)).toBeTruthy();
  });
});
