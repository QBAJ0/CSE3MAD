import { HeaderBackButton } from "@react-navigation/elements";
import { Stack, router } from "expo-router";

export default function ChallengeIdLayout() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen
        name="index"
        options={{
          title: "Challenge",
          headerLeft: (props) => (
            <HeaderBackButton
              {...props}
              onPress={() => router.replace("/(tabs)/activity")}
            />
          ),
        }}
      />
      <Stack.Screen name="record" options={{ title: "Record Data" }} />
      <Stack.Screen name="results" options={{ title: "Review & Submit" }} />
      <Stack.Screen name="details" options={{ title: "Details" }} />
    </Stack>
  );
}
