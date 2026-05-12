import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ErrorBoundary } from "../src/components/ui/ErrorBoundary";
import { ActivityProvider } from "../src/context/ActivityContext";
import { TeamProvider } from "../src/context/TeamContext";

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <TeamProvider>
          <ActivityProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(onboarding)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="activity" options={{ headerShown: false }} />
              <Stack.Screen
                name="challenge/[id]/index"
                options={{
                  headerShown: true,
                  title: "Challenge",
                  headerBackTitle: "Back",
                }}
              />
              <Stack.Screen
                name="challenge/[id]/record"
                options={{
                  headerShown: true,
                  title: "Record Data",
                  headerBackTitle: "Back",
                }}
              />
              <Stack.Screen
                name="challenge/[id]/results"
                options={{
                  headerShown: true,
                  title: "Review & Submit",
                  headerBackTitle: "Back",
                }}
              />
            </Stack>
          </ActivityProvider>
        </TeamProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
