import { Vibration } from "react-native";

export const useHaptic = () => {
  const trigger = (
    type: "light" | "medium" | "heavy" | "success" | "warning" | "error",
  ) => {
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
  };

  const success = () => trigger("success");
  const error = () => trigger("error");
  const light = () => trigger("light");
  const heavy = () => trigger("heavy");
  const warning = () => trigger("warning");

  return { haptic: trigger, success, error, light, heavy, warning };
};
