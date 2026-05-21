import type { Href } from "expo-router";

/**
 * Lab / hidden-tab paths are valid at runtime but omitted from generated typed routes.
 */
export function asHref(path: string): Href {
  return path as Href;
}
