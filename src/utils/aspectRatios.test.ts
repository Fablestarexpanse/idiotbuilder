import { describe, it, expect } from "vitest";
import { ASPECT_RATIO_PRESETS, PRESET_LABELS, detectPreset } from "./aspectRatios";

describe("ASPECT_RATIO_PRESETS", () => {
  it("contains all eight presets", () => {
    const keys = Object.keys(ASPECT_RATIO_PRESETS);
    expect(keys).toHaveLength(8);
  });

  it("PRESET_LABELS matches the presets object keys", () => {
    const presetKeys = Object.keys(ASPECT_RATIO_PRESETS).sort();
    const labelKeys = [...PRESET_LABELS].sort();
    expect(labelKeys).toEqual(presetKeys);
  });

  it("every preset has positive integer width and height", () => {
    for (const [label, res] of Object.entries(ASPECT_RATIO_PRESETS)) {
      expect(res.width, `${label} width`).toBeGreaterThan(0);
      expect(res.height, `${label} height`).toBeGreaterThan(0);
      expect(Number.isInteger(res.width), `${label} width is integer`).toBe(true);
      expect(Number.isInteger(res.height), `${label} height is integer`).toBe(true);
    }
  });

  it("1:1 is square", () => {
    expect(ASPECT_RATIO_PRESETS["1:1"].width).toBe(ASPECT_RATIO_PRESETS["1:1"].height);
  });

  it("landscape presets are wider than tall", () => {
    for (const preset of ["3:2", "4:3", "16:9", "21:9"] as const) {
      const { width, height } = ASPECT_RATIO_PRESETS[preset];
      expect(width, `${preset} should be landscape`).toBeGreaterThan(height);
    }
  });

  it("portrait presets are taller than wide", () => {
    for (const preset of ["2:3", "3:4", "9:16"] as const) {
      const { width, height } = ASPECT_RATIO_PRESETS[preset];
      expect(height, `${preset} should be portrait`).toBeGreaterThan(width);
    }
  });
});

describe("detectPreset", () => {
  it("returns the correct label for each known resolution", () => {
    for (const [label, res] of Object.entries(ASPECT_RATIO_PRESETS)) {
      expect(detectPreset(res)).toBe(label);
    }
  });

  it("returns null for an unknown resolution", () => {
    expect(detectPreset({ width: 1920, height: 1080 })).toBeNull();
  });

  it("returns null for a resolution with matching width but wrong height", () => {
    // 1:1 is 1024x1024; changing height should miss
    expect(detectPreset({ width: 1024, height: 768 })).toBeNull();
  });

  it("returns null for a resolution with matching height but wrong width", () => {
    expect(detectPreset({ width: 800, height: 1024 })).toBeNull();
  });
});
