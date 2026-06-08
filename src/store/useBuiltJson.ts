import { usePromptStore } from "./usePromptStore";
import { buildIdeogramJson } from "../utils/jsonBuilder";

/**
 * Returns the current prompt state serialized to a JSON string.
 * Centralizes the store→builder translation so JsonPanel and JsonExport
 * don't each duplicate the 9-field store destructuring.
 */
export function useBuiltJson(): string {
  const resolution = usePromptStore((s) => s.resolution);
  const highLevelDescription = usePromptStore((s) => s.highLevelDescription);
  const aesthetics = usePromptStore((s) => s.aesthetics);
  const lighting = usePromptStore((s) => s.lighting);
  const photo = usePromptStore((s) => s.photo);
  const medium = usePromptStore((s) => s.medium);
  const colorPalette = usePromptStore((s) => s.colorPalette);
  const background = usePromptStore((s) => s.background);
  const objects = usePromptStore((s) => s.objects);

  return JSON.stringify(
    buildIdeogramJson({ resolution, highLevelDescription, aesthetics, lighting, photo, medium, colorPalette, background, objects }),
    null,
    2,
  );
}
