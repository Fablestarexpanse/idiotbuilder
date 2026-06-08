export type BoundingBox = [number, number, number, number];

export interface ExtraProperty {
  id: string;
  key: string;
  value: string;
}

export interface PromptObject {
  id: string;
  label: string;
  /** "obj" for regular elements; "text" for text localization (serializes to type:"obj" with TEXT: prefix in desc). */
  type: "obj" | "text";
  /** For text elements: the literal string to display. Serialized into desc as TEXT: 'content'. */
  textContent?: string;
  zIndex: number;
  bbox: BoundingBox;
  desc: string;
  /** Per-element color palette as hex strings (e.g. ["#FF0000", "#00FF00"]). */
  colorPalette?: string[];
  extraProps: ExtraProperty[];
}

export type AspectRatioPreset = "1:1" | "3:2" | "4:3" | "16:9" | "21:9" | "2:3" | "3:4" | "9:16";

export interface Resolution {
  width: number;
  height: number;
}

export interface LmSettings {
  baseUrl: string;
  model: string;
}

/**
 * Subset of store state that can be serialized to / deserialized from an
 * Ideogram JSON file. Used by buildIdeogramJson and parseIdeogramJson as the
 * shared contract so build and parse form a symmetric round-trip pair.
 */
export interface ParsedPromptState {
  resolution: Resolution;
  highLevelDescription: string;
  aesthetics: string;
  lighting: string;
  photo: string;
  medium: string;
  colorPalette: string[];
  background: string;
  objects: PromptObject[];
}
