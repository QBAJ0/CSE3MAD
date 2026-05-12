/**
 * TypeScript / Metro fallback. Bundler resolves `ResultLocationMap.web.tsx` on web
 * and `ResultLocationMap.native.tsx` on iOS/Android when present.
 */
export type { ResultLocationMapProps } from "./ResultLocationMap.web";
export { ResultLocationMap } from "./ResultLocationMap.web";
