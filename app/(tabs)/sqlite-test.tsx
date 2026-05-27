import { Redirect } from "expo-router";

/** Hidden dev screen — not part of the student challenge flow. */
export default function DeprecatedSqliteTestScreen() {
  return <Redirect href="/(tabs)/profile" />;
}
