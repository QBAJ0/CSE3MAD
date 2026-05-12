import { Stack } from "expo-router";

export default function ActivityIdLayout() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ title: "Activity" }} />
      <Stack.Screen name="record" options={{ title: "Record result" }} />
    </Stack>
  );
}
