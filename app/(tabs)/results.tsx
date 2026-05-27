import { Redirect } from "expo-router";

/** Hidden tab — legacy lab SQLite viewer; challenge history is on Profile. */
export default function DeprecatedResultsScreen() {
  return <Redirect href="/(tabs)/profile" />;
}
