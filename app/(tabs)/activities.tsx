import { Redirect } from "expo-router";

/** Hidden tab — legacy lab list; use Challenges tab instead. */
export default function DeprecatedActivitiesScreen() {
  return <Redirect href="/(tabs)/activity" />;
}
