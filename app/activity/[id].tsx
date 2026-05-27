import { Redirect } from "expo-router";

/** Legacy `/activity/:id` URLs → official Challenges tab. */
export default function DeprecatedActivityIdScreen() {
  return <Redirect href="/(tabs)/activity" />;
}
