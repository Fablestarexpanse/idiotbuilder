export type BoundingBox = [number, number, number, number];

export interface ObjectColorPalette {
  main: string;
  secondary: string;
  tertiary: string;
}

export interface ExtraProperty {
  id: string;
  key: string;
  value: string;
}

export interface PromptObject {
  id: string;
  label: string;
  type: "obj";
  zIndex: number;
  bbox: BoundingBox;
  desc: string;
  colorPalette?: ObjectColorPalette;
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
