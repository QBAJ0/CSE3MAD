import { Stack } from "expo-router";

export default function ChallengeIdLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Challenge", headerBackTitle: "Back" }} />
      <Stack.Screen name="record" options={{ title: "Record Data", headerBackTitle: "Back" }} />
      <Stack.Screen name="results" options={{ title: "Review & Submit", headerBackTitle: "Back" }} />
      <Stack.Screen name="details" options={{ title: "Details", headerBackTitle: "Back" }} />
    </Stack>
  );
}
