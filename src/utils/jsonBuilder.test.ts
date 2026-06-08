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

/** Build with default empty style fields for brevity in most tests. */
function build(
  objects: PromptObject[],
  overrides: {
    resolution?: Resolution;
    highLevelDescription?: string;
    aesthetics?: string;
    lighting?: string;
    photo?: string;
    medium?: string;
    colorPalette?: string[];
    background?: string;
  } = {},
) {
  return buildIdeogramJson(
    overrides.resolution ?? RES,
    overrides.highLevelDescription ?? "",
    overrides.aesthetics ?? "",
    overrides.lighting ?? "",
    overrides.photo ?? "",
    overrides.medium ?? "",
    overrides.colorPalette ?? [],
    overrides.background ?? "",
    objects,
  );
}

// ---------------------------------------------------------------------------
// buildIdeogramJson — structure
// ---------------------------------------------------------------------------

describe("buildIdeogramJson — output structure", () => {
  it("puts medium inside style_description", () => {
    const result = build([], { medium: "oil painting" });
    expect(result.style_description.medium).toBe("oil painting");
    expect((result as unknown as Record<string, unknown>)["medium"]).toBeUndefined();
  });

  it("puts color_palette inside style_description", () => {
    const result = build([], { colorPalette: ["#FF0000"] });
    expect(result.style_description.color_palette).toEqual(["#FF0000"]);
    expect((result as unknown as Record<string, unknown>)["color_palette"]).toBeUndefined();
  });

  it("includes high_level_description", () => {
    expect(build([], { highLevelDescription: "A test scene" }).high_level_description).toBe("A test scene");
  });

  it("includes style_description fields", () => {
    const result = build([], { aesthetics: "cinematic", lighting: "golden hour", photo: "35mm" });
    expect(result.style_description.aesthetics).toBe("cinematic");
    expect(result.style_description.lighting).toBe("golden hour");
    expect(result.style_description.photo).toBe("35mm");
  });

  it("uses 'elements' not 'objects' as the key", () => {
    const result = build([makeObject()]);
    expect(result.compositional_deconstruction.elements).toBeDefined();
    expect((result.compositional_deconstruction as Record<string, unknown>)["objects"]).toBeUndefined();
  });

  it("sets background in compositional_deconstruction", () => {
    expect(build([], { background: "Deep ocean" }).compositional_deconstruction.background).toBe("Deep ocean");
  });
});

// ---------------------------------------------------------------------------
// buildIdeogramJson — regular obj elements
// ---------------------------------------------------------------------------

describe("buildIdeogramJson — obj elements", () => {
  it("sorts elements by zIndex ascending", () => {
    const a = makeObject({ id: "a", zIndex: 3, label: "top" });
    const b = makeObject({ id: "b", zIndex: 1, label: "bottom" });
    const c = makeObject({ id: "c", zIndex: 2, label: "mid" });
    const labels = build([a, b, c]).compositional_deconstruction.elements.map((e) => e.label);
    expect(labels).toEqual(["bottom", "mid", "top"]);
  });

  it("maps PromptObject fields to element correctly", () => {
    const obj = makeObject({ label: "hero", zIndex: 2, bbox: [10, 20, 300, 400], desc: "The hero" });
    const el = build([obj]).compositional_deconstruction.elements[0];
    expect(el.label).toBe("hero");
    expect(el["z-index"]).toBe(2);
    expect(el.bbox).toEqual([10, 20, 300, 400]);
    expect(el.desc).toBe("The hero");
    expect(el.type).toBe("obj");
  });

  it("omits color_palette on element when undefined", () => {
    const el = build([makeObject({ colorPalette: undefined })]).compositional_deconstruction.elements[0];
    expect(el).not.toHaveProperty("color_palette");
  });

  it("includes element color_palette as string[] when defined", () => {
    const el = build([makeObject({ colorPalette: ["#111", "#222"] })]).compositional_deconstruction.elements[0];
    expect(el.color_palette).toEqual(["#111", "#222"]);
  });

  it("inlines extra props with non-empty keys", () => {
    const obj = makeObject({
      extraProps: [
        { id: "p1", key: "mood", value: "dramatic" },
        { id: "p2", key: "  ", value: "ignored" },
      ],
    });
    const el = build([obj]).compositional_deconstruction.elements[0];
    expect(el["mood"]).toBe("dramatic");
    expect(el).not.toHaveProperty("  ");
  });

  it("does not mutate the original objects array", () => {
    const a = makeObject({ zIndex: 2 });
    const b = makeObject({ zIndex: 1 });
    const original = [a, b];
    build(original);
    expect(original[0]).toBe(a);
    expect(original[1]).toBe(b);
  });
});

// ---------------------------------------------------------------------------
// buildIdeogramJson — text elements
// ---------------------------------------------------------------------------

describe("buildIdeogramJson — text elements", () => {
  it("serializes text type as type:'obj' in output", () => {
    const obj = makeObject({ type: "text", textContent: "Hello", desc: "A label" });
    const el = build([obj]).compositional_deconstruction.elements[0];
    expect(el.type).toBe("obj");
  });

  it("formats desc as TEXT: 'content' body bbox=[...]", () => {
    const obj = makeObject({
      type: "text",
      textContent: "HELLO",
      desc: "Bold white lettering.",
      bbox: [0, 0, 896, 115], // top 10% of 1152-height image
    });
    const el = build([obj]).compositional_deconstruction.elements[0];
    expect(el.desc).toMatch(/^TEXT: 'HELLO' Bold white lettering\. bbox=\[\d+,\d+,\d+,\d+\]$/);
  });

  it("normalizes bbox coords to 1000×1000 space", () => {
    // bbox covering full image → should be [0,0,1000,1000]
    const obj = makeObject({ type: "text", textContent: "X", desc: "", bbox: [0, 0, 896, 1152] });
    const el = build([obj]).compositional_deconstruction.elements[0];
    expect(el.desc).toContain("bbox=[0,0,1000,1000]");
  });

  it("handles empty textContent gracefully", () => {
    const obj = makeObject({ type: "text", textContent: "", desc: "some desc" });
    const el = build([obj]).compositional_deconstruction.elements[0];
    expect(el.desc).toMatch(/^TEXT: '' /);
  });
});

// ---------------------------------------------------------------------------
// parseIdeogramJson — new format
// ---------------------------------------------------------------------------

describe("parseIdeogramJson — new format", () => {
  function buildJson(overrides: Record<string, unknown> = {}): string {
    return JSON.stringify({
      resolution: "896x1152",
      high_level_description: "A scenic view",
      style_description: {
        aesthetics: "painterly",
        lighting: "soft diffuse",
        photo: "",
        medium: "oil painting",
        color_palette: ["#FF0000"],
      },
      compositional_deconstruction: {
        background: "Misty forest",
        elements: [
          {
            type: "obj",
            label: "tree",
            "z-index": 1,
            bbox: [100, 200, 500, 900],
            desc: "A tall oak tree",
            color_palette: ["#225522"],
          },
        ],
      },
      ...overrides,
    });
  }

  it("parses resolution", () => {
    expect(parseIdeogramJson(buildJson()).resolution).toEqual({ width: 896, height: 1152 });
  });

  it("parses high_level_description", () => {
    expect(parseIdeogramJson(buildJson()).highLevelDescription).toBe("A scenic view");
  });

  it("parses style_description fields", () => {
    const r = parseIdeogramJson(buildJson());
    expect(r.aesthetics).toBe("painterly");
    expect(r.lighting).toBe("soft diffuse");
    expect(r.photo).toBe("");
    expect(r.medium).toBe("oil painting");
    expect(r.colorPalette).toEqual(["#FF0000"]);
  });

  it("parses background", () => {
    expect(parseIdeogramJson(buildJson()).background).toBe("Misty forest");
  });

  it("parses element as obj type", () => {
    const obj = parseIdeogramJson(buildJson()).objects[0];
    expect(obj.type).toBe("obj");
    expect(obj.label).toBe("tree");
    expect(obj.zIndex).toBe(1);
    expect(obj.bbox).toEqual([100, 200, 500, 900]);
    expect(obj.desc).toBe("A tall oak tree");
    expect(obj.colorPalette).toEqual(["#225522"]);
  });

  it("assigns UUID to each element", () => {
    const obj = parseIdeogramJson(buildJson()).objects[0];
    expect(obj.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it("throws SyntaxError on invalid JSON", () => {
    expect(() => parseIdeogramJson("not json")).toThrow(SyntaxError);
  });
});

// ---------------------------------------------------------------------------
// parseIdeogramJson — old format backwards compatibility
// ---------------------------------------------------------------------------

describe("parseIdeogramJson — old format fallback", () => {
  function oldJson(): string {
    return JSON.stringify({
      resolution: "1024x1024",
      medium: "digital art",
      color_palette: ["#AABBCC"],
      compositional_deconstruction: {
        background: "Sky",
        objects: [
          {
            label: "cloud",
            type: "obj",
            "z-index": 1,
            bbox: [0, 0, 1024, 512],
            desc: "A fluffy cloud",
            color_palette: ["#FFFFFF"],
          },
        ],
      },
    });
  }

  it("reads medium from top level when style_description absent", () => {
    expect(parseIdeogramJson(oldJson()).medium).toBe("digital art");
  });

  it("reads color_palette from top level when style_description absent", () => {
    expect(parseIdeogramJson(oldJson()).colorPalette).toEqual(["#AABBCC"]);
  });

  it("reads elements from 'objects' key", () => {
    expect(parseIdeogramJson(oldJson()).objects).toHaveLength(1);
    expect(parseIdeogramJson(oldJson()).objects[0].label).toBe("cloud");
  });

  it("parses old object-format color_palette into string[]", () => {
    const json = JSON.stringify({
      resolution: "896x1152",
      compositional_deconstruction: {
        background: "",
        objects: [{
          label: "fig",
          type: "obj",
          "z-index": 1,
          bbox: [0, 0, 896, 1152],
          desc: "test",
          color_palette: { main: "#111111", secondary: "#222222", tertiary: "#333333" },
        }],
      },
    });
    const obj = parseIdeogramJson(json).objects[0];
    expect(Array.isArray(obj.colorPalette)).toBe(true);
    expect(obj.colorPalette).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// parseIdeogramJson — text elements
// ---------------------------------------------------------------------------

describe("parseIdeogramJson — text elements", () => {
  it("detects TEXT: desc prefix and sets type to 'text'", () => {
    const json = JSON.stringify({
      resolution: "896x1152",
      compositional_deconstruction: {
        background: "",
        elements: [{
          type: "obj",
          label: "caption",
          "z-index": 2,
          bbox: [0, 0, 896, 1152],
          desc: "TEXT: 'Hello World' White serif lettering. bbox=[250,80,750,180]",
        }],
      },
    });
    const obj = parseIdeogramJson(json).objects[0];
    expect(obj.type).toBe("text");
    expect(obj.textContent).toBe("Hello World");
    expect(obj.desc).toBe("White serif lettering.");
  });

  it("denormalizes bbox from 1000×1000 to resolution space", () => {
    // [500,500,1000,1000] on 1000×1000 → [448,576,896,1152] on 896×1152
    const json = JSON.stringify({
      resolution: "896x1152",
      compositional_deconstruction: {
        background: "",
        elements: [{
          type: "obj",
          label: "t",
          "z-index": 1,
          bbox: [0, 0, 896, 1152],
          desc: "TEXT: 'X' desc bbox=[500,500,1000,1000]",
        }],
      },
    });
    const obj = parseIdeogramJson(json).objects[0];
    expect(obj.bbox[0]).toBe(Math.round(0.5 * 896));
    expect(obj.bbox[1]).toBe(Math.round(0.5 * 1152));
    expect(obj.bbox[2]).toBe(896);
    expect(obj.bbox[3]).toBe(1152);
  });
});

// ---------------------------------------------------------------------------
// Round-trip
// ---------------------------------------------------------------------------

describe("round-trip", () => {
  it("round-trips a full scene through build → parse", () => {
    const obj = makeObject({ label: "subject", zIndex: 1, bbox: [50, 50, 400, 800], desc: "A subject" });
    const built = build([obj], {
      highLevelDescription: "A portrait",
      aesthetics: "cinematic",
      lighting: "rim lighting",
      photo: "85mm",
      medium: "digital art",
      colorPalette: ["#AABBCC"],
      background: "Studio backdrop",
    });
    const parsed = parseIdeogramJson(JSON.stringify(built));

    expect(parsed.resolution).toEqual(RES);
    expect(parsed.highLevelDescription).toBe("A portrait");
    expect(parsed.aesthetics).toBe("cinematic");
    expect(parsed.lighting).toBe("rim lighting");
    expect(parsed.photo).toBe("85mm");
    expect(parsed.medium).toBe("digital art");
    expect(parsed.colorPalette).toEqual(["#AABBCC"]);
    expect(parsed.background).toBe("Studio backdrop");
    expect(parsed.objects).toHaveLength(1);
    expect(parsed.objects[0].label).toBe("subject");
    expect(parsed.objects[0].bbox).toEqual([50, 50, 400, 800]);
  });

  it("round-trips a text element through build → parse", () => {
    const textObj = makeObject({
      type: "text",
      textContent: "SALE",
      desc: "Red bold uppercase.",
      bbox: [224, 0, 672, 115], // roughly top-quarter center
      zIndex: 5,
    });
    const built = build([textObj]);
    const parsed = parseIdeogramJson(JSON.stringify(built));

    const parsedText = parsed.objects[0];
    expect(parsedText.type).toBe("text");
    expect(parsedText.textContent).toBe("SALE");
    expect(parsedText.desc).toBe("Red bold uppercase.");
    // bbox should round-trip through normalization within ±2px
    expect(Math.abs(parsedText.bbox[0] - 224)).toBeLessThanOrEqual(2);
    expect(Math.abs(parsedText.bbox[2] - 672)).toBeLessThanOrEqual(2);
  });
});
