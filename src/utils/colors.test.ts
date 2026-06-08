import { describe, it, expect } from "vitest";
import { getObjectColor } from "./colors";

describe("getObjectColor", () => {
  it("returns a string starting with #", () => {
    expect(getObjectColor(0)).toMatch(/^#/);
  });

  it("returns the same colour for the same index", () => {
    expect(getObjectColor(3)).toBe(getObjectColor(3));
  });

  it("wraps around — index 0 and index palette-length return the same colour", () => {
    // Determine the palette length by finding the cycle period
    const first = getObjectColor(0);
    let period = 1;
    while (getObjectColor(period) !== first && period < 100) {
      period++;
    }
    expect(period).toBeGreaterThan(1); // sanity: palette has more than one colour
    expect(getObjectColor(period)).toBe(first);
  });

  it("adjacent indices return different colours", () => {
    // Not strictly required by the contract, but a palette with two identical
    // adjacent colours would be a design bug worth catching.
    const palette: string[] = [];
    for (let i = 0; i < 12; i++) palette.push(getObjectColor(i));
    for (let i = 0; i < palette.length - 1; i++) {
      expect(palette[i], `colours at index ${i} and ${i + 1} should differ`).not.toBe(palette[i + 1]);
    }
  });

  it("handles large indices via modulo without throwing", () => {
    expect(() => getObjectColor(999999)).not.toThrow();
    expect(getObjectColor(999999)).toMatch(/^#/);
  });

  it("is deterministic — calling twice returns the same value", () => {
    for (let i = 0; i < 20; i++) {
      expect(getObjectColor(i)).toBe(getObjectColor(i));
    }
  });
});
