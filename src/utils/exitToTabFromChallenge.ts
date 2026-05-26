import { CommonActions } from "@react-navigation/native";
import { router } from "expo-router";
import { resolveHref } from "expo-router/build/link/href";
import { store } from "expo-router/build/global-state/router-store";

export type TabExitHref =
  | "/(tabs)/leaderboard"
  | "/(tabs)/activity"
  | "/(tabs)/home";

/**
 * Exit the nested challenge stack and open a tab at the root navigator.
 *
 * router.replace("/(tabs)/…") from challenge/results targets the inner stack and
 * throws "action was not handled".
 */
export function exitToTabFromChallenge(
  href: TabExitHref,
  onAfterNavigate?: () => void,
): void {
  const navigationRef = store.navigationRef.current;
  const linking = store.linking;

  if (navigationRef?.isReady() && linking) {
    const path = resolveHref(href);
    const state = linking.getStateFromPath(path, linking.config);
    if (state) {
      navigationRef.dispatch(CommonActions.reset(state));
      if (onAfterNavigate) {
        requestAnimationFrame(onAfterNavigate);
      }
      return;
    }
  }

  router.navigate(href);
  if (onAfterNavigate) {
    requestAnimationFrame(onAfterNavigate);
  }
}
