import { ImageSourcePropType } from "react-native";

export type HumanPerformanceTrial = {
  prototypeIndex: number;
  movementType: string;
  tabLabel: string;
  image: ImageSourcePropType;
};

export const HUMAN_PERFORMANCE_TRIALS: HumanPerformanceTrial[] = [
  {
    prototypeIndex: 1,
    movementType: "Hand circles",
    tabLabel: "Hand circles",
    image: require("../../assets/images/m1.png"),
  },
  {
    prototypeIndex: 2,
    movementType: "Hand up and down",
    tabLabel: "Up and down",
    image: require("../../assets/images/m2.png"),
  },
  {
    prototypeIndex: 3,
    movementType: "Hand side to side",
    tabLabel: "Side to side",
    image: require("../../assets/images/m3.png"),
  },
];

export function getTrialForPrototype(
  prototypeIndex: number,
): HumanPerformanceTrial | undefined {
  return HUMAN_PERFORMANCE_TRIALS.find((t) => t.prototypeIndex === prototypeIndex);
}

export function getTrialLabelForPrototype(prototypeIndex: number): string {
  return (
    getTrialForPrototype(prototypeIndex)?.tabLabel ??
    getTrialForPrototype(prototypeIndex)?.movementType ??
    `Trial ${prototypeIndex}`
  );
}
