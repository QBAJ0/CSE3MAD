import { useCallback } from "react";
import { Vibration } from "react-native";

export const useHaptic = () => {
  const trigger = useCallback(
    (type: "light" | "medium" | "heavy" | "success" | "warning" | "error") => {
      switch (type) {
        case "light":
          Vibration.vibrate(10);
          break;
        case "medium":
          Vibration.vibrate(30);
          break;
        case "heavy":
          Vibration.vibrate(50);
          break;
        case "success":
          Vibration.vibrate([50, 100, 50]);
          break;
        case "warning":
          Vibration.vibrate([100, 50, 100]);
          break;
        case "error":
          Vibration.vibrate([200, 100, 200]);
          break;
        default:
          Vibration.vibrate(20);
      }
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
