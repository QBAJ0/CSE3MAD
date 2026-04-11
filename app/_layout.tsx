import { Stack } from "expo-router";
import { TeamProvider } from "../context/TeamContext";

export default function RootLayout() {
  return (
    <TeamProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="register" />
        <Stack.Screen name="join-team" />
        <Stack.Screen name="team-confirmation" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </TeamProvider>
  );
}
