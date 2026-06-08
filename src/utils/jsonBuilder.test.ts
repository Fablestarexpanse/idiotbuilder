import { describe, it, expect } from "vitest";
import { buildIdeogramJson, parseIdeogramJson } from "./jsonBuilder";
import type { PromptObject, Resolution } from "../types/prompt";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const RES: Resolution = { width: 896, height: 1152 };

function makeObject(overrides: Partial<PromptObject> = {}): PromptObject {
  return {
    id: "test-id",
    label: "figure",
    type: "obj",
    zIndex: 1,
    bbox: [0, 0, 896, 1152],
    desc: "A test object",
    extraProps: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// buildIdeogramJson
// ---------------------------------------------------------------------------

describe("buildIdeogramJson", () => {
  it("encodes resolution as WxH string", () => {
    const result = buildIdeogramJson(RES, "oil painting", [], "", []);
    expect(result.resolution).toBe("896x1152");
  });

  it("passes medium through unchanged", () => {
    const result = buildIdeogramJson(RES, "watercolour sketch", [], "", []);
    expect(result.medium).toBe("watercolour sketch");
  });

  it("omits color_palette when the array is empty", () => {
    const result = buildIdeogramJson(RES, "", [], "", []);
    expect(result).not.toHaveProperty("color_palette");
  });

  it("includes color_palette when non-empty", () => {
    const result = buildIdeogramJson(RES, "", ["#FF0000", "#00FF00"], "", []);
    expect(result.color_palette).toEqual(["#FF0000", "#00FF00"]);
  });

  it("sets background in compositional_deconstruction", () => {
    const result = buildIdeogramJson(RES, "", [], "Deep ocean floor", []);
    expect(result.compositional_deconstruction.background).toBe("Deep ocean floor");
  });

  it("sorts objects by zIndex ascending", () => {
    const a = makeObject({ id: "a", zIndex: 3, label: "top" });
    const b = makeObject({ id: "b", zIndex: 1, label: "bottom" });
    const c = makeObject({ id: "c", zIndex: 2, label: "mid" });
    const result = buildIdeogramJson(RES, "", [], "", [a, b, c]);
    const labels = result.compositional_deconstruction.objects.map((o) => o.label);
    expect(labels).toEqual(["bottom", "mid", "top"]);
  });

  it("maps PromptObject fields to IdeogramObject correctly", () => {
    const obj = makeObject({ label: "hero", zIndex: 2, bbox: [10, 20, 300, 400], desc: "The hero" });
    const result = buildIdeogramJson(RES, "", [], "", [obj]);
    const out = result.compositional_deconstruction.objects[0];
    expect(out.label).toBe("hero");
    expect(out["z-index"]).toBe(2);
    expect(out.bbox).toEqual([10, 20, 300, 400]);
    expect(out.desc).toBe("The hero");
    expect(out.type).toBe("obj");
  });

  it("omits color_palette on object when undefined", () => {
    const obj = makeObject({ colorPalette: undefined });
    const result = buildIdeogramJson(RES, "", [], "", [obj]);
    expect(result.compositional_deconstruction.objects[0]).not.toHaveProperty("color_palette");
  });

  it("includes object color_palette when defined", () => {
    const palette = { main: "#111", secondary: "#222", tertiary: "#333" };
    const obj = makeObject({ colorPalette: palette });
    const result = buildIdeogramJson(RES, "", [], "", [obj]);
    expect(result.compositional_deconstruction.objects[0].color_palette).toEqual(palette);
  });

  it("inlines extra props with non-empty keys", () => {
    const obj = makeObject({
      extraProps: [
        { key: "mood", value: "dramatic" },
        { key: "  ", value: "ignored" }, // whitespace-only key — should be skipped
      ],
    });
    const result = buildIdeogramJson(RES, "", [], "", [obj]);
    const out = result.compositional_deconstruction.objects[0];
    expect(out["mood"]).toBe("dramatic");
    expect(out).not.toHaveProperty("  ");
  });

  it("does not mutate the original objects array", () => {
    const a = makeObject({ zIndex: 2 });
    const b = makeObject({ zIndex: 1 });
    const original = [a, b];
    buildIdeogramJson(RES, "", [], "", original);
    expect(original[0]).toBe(a);
    expect(original[1]).toBe(b);
  });
});

// ---------------------------------------------------------------------------
// parseIdeogramJson
// ---------------------------------------------------------------------------

describe("parseIdeogramJson", () => {
  function buildJson(overrides: Record<string, unknown> = {}): string {
    return JSON.stringify({
      resolution: "896x1152",
      medium: "oil painting",
      color_palette: ["#FF0000"],
      compositional_deconstruction: {
        background: "Misty forest",
        objects: [
          {
            label: "tree",
            type: "obj",
            "z-index": 1,
            bbox: [100, 200, 500, 900],
            desc: "A tall oak tree",
          },
        ],
      },
      ...overrides,
    });
  }

  it("parses resolution correctly", () => {
    const result = parseIdeogramJson(buildJson());
    expect(result.resolution).toEqual({ width: 896, height: 1152 });
  });

  it("parses medium", () => {
    const result = parseIdeogramJson(buildJson());
    expect(result.medium).toBe("oil painting");
  });

  it("parses global color_palette", () => {
    const result = parseIdeogramJson(buildJson());
    expect(result.colorPalette).toEqual(["#FF0000"]);
  });

  it("parses background", () => {
    const result = parseIdeogramJson(buildJson());
    expect(result.background).toBe("Misty forest");
  });

  it("parses object fields", () => {
    const result = parseIdeogramJson(buildJson());
    const obj = result.objects[0];
    expect(obj.label).toBe("tree");
    expect(obj.type).toBe("obj");
    expect(obj.zIndex).toBe(1);
    expect(obj.bbox).toEqual([100, 200, 500, 900]);
    expect(obj.desc).toBe("A tall oak tree");
    expect(obj.extraProps).toEqual([]);
  });

  it("assigns each object a UUID-shaped id", () => {
    const result = parseIdeogramJson(buildJson());
    expect(result.objects[0].id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("uses fallback resolution when missing", () => {
    const json = JSON.stringify({
      medium: "test",
      compositional_deconstruction: { background: "", objects: [] },
    });
    const result = parseIdeogramJson(json);
    expect(result.resolution).toEqual({ width: 896, height: 1152 });
  });

  it("returns empty objects array when none present", () => {
    const json = JSON.stringify({
      resolution: "1024x1024",
      medium: "",
      compositional_deconstruction: { background: "", objects: [] },
    });
    const result = parseIdeogramJson(json);
    expect(result.objects).toHaveLength(0);
  });

  it("throws SyntaxError on invalid JSON", () => {
    expect(() => parseIdeogramJson("not json at all")).toThrow(SyntaxError);
  });

  it("round-trips through buildIdeogramJson", () => {
    const obj = makeObject({ label: "subject", zIndex: 1, bbox: [50, 50, 400, 800], desc: "A subject" });
    const json = JSON.stringify(buildIdeogramJson(RES, "digital art", ["#AABBCC"], "Sky backdrop", [obj]));
    const parsed = parseIdeogramJson(json);

    expect(parsed.resolution).toEqual(RES);
    expect(parsed.medium).toBe("digital art");
    expect(parsed.colorPalette).toEqual(["#AABBCC"]);
    expect(parsed.background).toBe("Sky backdrop");
    expect(parsed.objects).toHaveLength(1);
    expect(parsed.objects[0].label).toBe("subject");
    expect(parsed.objects[0].bbox).toEqual([50, 50, 400, 800]);
  });
});
