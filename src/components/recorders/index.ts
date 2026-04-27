// Cross-platform recorders (safe to re-export directly)
export { ChoiceRecorder } from "./ChoiceRecorder";
export { GPSTagger } from "./GPSTagger";
export { NumberRecorder } from "./NumberRecorder";
export { PhotoRecorder } from "./PhotoRecorder";
export { StopwatchRecorder } from "./StopwatchRecorder";
export { TapReactionGame } from "./TapReactionGame";
export { TeamReactionBoard } from "./TeamReactionBoard";
export { TextRecorder } from "./TextRecorder";
export { TracingRecorder } from "./TracingRecorder";

// Platform-specific recorders: Metro resolves .native / .web variants automatically.
// Import them via this barrel or directly from their file.
export { AccelerometerRecorder } from "./AccelerometerRecorder";
export { GyroscopeRecorder } from "./GyroscopeRecorder";
export { SoundMeterRecorder } from "./SoundMeterRecorder";
export { VideoRecorder } from "./VideoRecorder";
