import { AspectRatioPreset, Resolution } from "../types/prompt";

export const ASPECT_RATIO_PRESETS: Record<AspectRatioPreset, Resolution> = {
  "1:1":  { width: 1024, height: 1024 },
  "3:2":  { width: 1152, height: 768 },
  "4:3":  { width: 1152, height: 896 },
  "16:9": { width: 1344, height: 768 },
  "21:9": { width: 1536, height: 640 },
  "2:3":  { width: 768,  height: 1152 },
  "3:4":  { width: 896,  height: 1152 },
  "9:16": { width: 768,  height: 1344 },
};

export const PRESET_LABELS: AspectRatioPreset[] = [
  "1:1", "3:2", "4:3", "16:9", "21:9", "2:3", "3:4", "9:16",
];

export function detectPreset(res: Resolution): AspectRatioPreset | null {
  for (const [key, val] of Object.entries(ASPECT_RATIO_PRESETS)) {
    if (val.width === res.width && val.height === res.height) {
      return key as AspectRatioPreset;
    }
  }
  return null;
}
