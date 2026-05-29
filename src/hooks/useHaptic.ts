import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { Platform } from "react-native";

export const useHaptic = () => {
  const trigger = useCallback(
    (type: "light" | "medium" | "heavy" | "success" | "warning" | "error") => {
      if (Platform.OS === "web") return;

      void (async () => {
        try {
          switch (type) {
            case "light":
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              break;
            case "medium":
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              break;
            case "heavy":
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              break;
            case "success":
              await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
              break;
            case "warning":
              await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Warning,
              );
              break;
            case "error":
              await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Error,
              );
              break;
          }
        } catch {
          // Some devices/simulators do not support haptics.
        }
      })();
    },
    [],
  );

  const success = useCallback(() => trigger("success"), [trigger]);
  const error = useCallback(() => trigger("error"), [trigger]);
  const light = useCallback(() => trigger("light"), [trigger]);
  const heavy = useCallback(() => trigger("heavy"), [trigger]);
  const warning = useCallback(() => trigger("warning"), [trigger]);

  return { haptic: trigger, success, error, light, heavy, warning };
};
