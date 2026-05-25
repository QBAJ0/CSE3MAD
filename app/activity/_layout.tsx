import { Redirect } from "expo-router";

/** Legacy `/activity` lab flow — redirect to the official Challenges tab. */
export default function DeprecatedActivityLayout() {
  return <Redirect href="/(tabs)/activity" />;
}
