import { PromptObject, Resolution } from "../types/prompt";

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

// ---------------------------------------------------------------------------
// Output types (internal — matches the LLM JSON schema)
// ---------------------------------------------------------------------------

interface IdeogramElement {
  type: "obj";
  label: string;
  "z-index": number;
  bbox: [number, number, number, number];
  desc: string;
  color_palette?: string[];
  [key: string]: unknown;
}

interface IdeogramOutput {
  high_level_description: string;
  style_description: {
    aesthetics: string;
    lighting: string;
    photo: string;
    medium: string;
    color_palette: string[];
  };
  compositional_deconstruction: {
    background: string;
    elements: IdeogramElement[];
  };
}

// ---------------------------------------------------------------------------
// Coordinate helpers — normalize bbox from resolution-space to 1000×1000
// ---------------------------------------------------------------------------

function normalizeBbox(
  bbox: [number, number, number, number],
  resolution: Resolution,
): [number, number, number, number] {
  return [
    Math.round((bbox[0] / resolution.width) * 1000),
    Math.round((bbox[1] / resolution.height) * 1000),
    Math.round((bbox[2] / resolution.width) * 1000),
    Math.round((bbox[3] / resolution.height) * 1000),
  ];
}

function denormalizeBbox(
  bbox: [number, number, number, number],
  resolution: Resolution,
): [number, number, number, number] {
  return [
    Math.round((bbox[0] / 1000) * resolution.width),
    Math.round((bbox[1] / 1000) * resolution.height),
    Math.round((bbox[2] / 1000) * resolution.width),
    Math.round((bbox[3] / 1000) * resolution.height),
  ];
}

// ---------------------------------------------------------------------------
// buildIdeogramJson
// ---------------------------------------------------------------------------

export function buildIdeogramJson(
  resolution: Resolution,
  highLevelDescription: string,
  aesthetics: string,
  lighting: string,
  photo: string,
  medium: string,
  colorPalette: string[],
  background: string,
  objects: PromptObject[],
): IdeogramOutput {
  const sorted = [...objects].sort((a, b) => a.zIndex - b.zIndex);

  const elements: IdeogramElement[] = sorted.map((obj) => {
    let desc: string;

    if (obj.type === "text") {
      // TEXT: 'content' desc. bbox=[x1,y1,x2,y2] on 1000×1000 canvas
      const normBox = normalizeBbox(obj.bbox, resolution);
      const content = obj.textContent ?? "";
      const bodyDesc = obj.desc.trim();
      desc = `TEXT: '${content}'${bodyDesc ? ` ${bodyDesc}` : ""} bbox=[${normBox.join(",")}]`;
    } else {
      desc = obj.desc;
    }

    const el: IdeogramElement = {
      type: "obj", // always "obj" in the output — text is signalled by desc prefix
      label: obj.label,
      "z-index": obj.zIndex,
      bbox: obj.bbox,
      desc,
    };

    if (obj.colorPalette && obj.colorPalette.length > 0) {
      el.color_palette = obj.colorPalette;
    }

    for (const ep of obj.extraProps) {
      if (ep.key.trim()) {
        el[ep.key] = ep.value;
      }
    }

    return el;
  });

  return {
    high_level_description: highLevelDescription,
    style_description: {
      aesthetics,
      lighting,
      photo,
      medium,
      color_palette: colorPalette,
    },
    compositional_deconstruction: {
      background,
      elements,
    },
  };
}

// ---------------------------------------------------------------------------
// parseIdeogramJson
// ---------------------------------------------------------------------------

// Matches: TEXT: 'content' some desc. bbox=[x1,y1,x2,y2]
const TEXT_DESC_RE = /^TEXT:\s*'([^']*)'\s*(.*?)\s*bbox=\[(\d+),(\d+),(\d+),(\d+)\]\s*$/s;

/**
 * Parse a saved Ideogram JSON file (or LLM output) back into prompt store state.
 * Handles both the new schema (style_description / elements) and the old schema
 * (top-level medium/color_palette / objects) for backwards compatibility.
 * Throws SyntaxError on invalid JSON.
 * Callers are responsible for catching and surfacing errors to the user.
 */
export function parseIdeogramJson(text: string): ParsedPromptState {
  const data = JSON.parse(text) as Record<string, unknown>;

  // Resolution
  const resolutionStr = typeof data.resolution === "string" ? data.resolution : "896x1152";
  const [w, h] = resolutionStr.split("x").map(Number);
  const resolution: Resolution = { width: w, height: h };

  // style_description (new format) with fallback to top-level keys (old format)
  const sd = data.style_description as Record<string, unknown> | undefined;
  const highLevelDescription = typeof data.high_level_description === "string" ? data.high_level_description : "";
  const aesthetics = typeof sd?.aesthetics === "string" ? sd.aesthetics : "";
  const lighting = typeof sd?.lighting === "string" ? sd.lighting : "";
  const photo = typeof sd?.photo === "string" ? sd.photo : "";
  const medium =
    typeof sd?.medium === "string" ? sd.medium
    : typeof data.medium === "string" ? data.medium
    : "";

  // Global color palette — new format: style_description.color_palette; old: top-level color_palette
  const rawPalette = Array.isArray(sd?.color_palette) ? sd!.color_palette
    : Array.isArray(data.color_palette) ? data.color_palette
    : [];
  const colorPalette = (rawPalette as unknown[]).filter((c) => typeof c === "string") as string[];

  // compositional_deconstruction
  const cd = data.compositional_deconstruction as Record<string, unknown> | undefined;
  const background = typeof cd?.background === "string" ? cd.background : "";

  // elements key (new) or objects key (old)
  const rawElements = Array.isArray(cd?.elements) ? (cd!.elements as Record<string, unknown>[])
    : Array.isArray(cd?.objects) ? (cd!.objects as Record<string, unknown>[])
    : [];

  const objects: PromptObject[] = rawElements.map((o, idx) => {
    const rawDesc = String(o.desc ?? "");
    const rawPal = o.color_palette;

    // Element color palette — new format: string[]; old: {main, secondary, tertiary}
    let elemPalette: string[] | undefined;
    if (Array.isArray(rawPal)) {
      elemPalette = (rawPal as unknown[]).filter((c) => typeof c === "string") as string[];
    } else if (rawPal && typeof rawPal === "object") {
      // Old object format — extract values into array
      elemPalette = Object.values(rawPal as Record<string, unknown>)
        .filter((v) => typeof v === "string") as string[];
    }
    if (elemPalette && elemPalette.length === 0) elemPalette = undefined;

    // Detect text elements
    const textMatch = TEXT_DESC_RE.exec(rawDesc);
    if (textMatch) {
      const [, content, bodyDesc, x1s, y1s, x2s, y2s] = textMatch;
      const normBox: [number, number, number, number] = [
        Number(x1s), Number(y1s), Number(x2s), Number(y2s),
      ];
      return {
        id: crypto.randomUUID(),
        label: String(o.label ?? "text"),
        type: "text" as const,
        textContent: content,
        zIndex: Number(o["z-index"] ?? idx + 1),
        bbox: denormalizeBbox(normBox, resolution),
        desc: bodyDesc,
        colorPalette: elemPalette,
        extraProps: [],
      };
    }

    return {
      id: crypto.randomUUID(),
      label: String(o.label ?? "obj"),
      type: "obj" as const,
      zIndex: Number(o["z-index"] ?? idx + 1),
      bbox: (o.bbox as [number, number, number, number]) ?? [0, 0, w, h],
      desc: rawDesc,
      colorPalette: elemPalette,
      extraProps: [],
    };
  });

  return {
    resolution,
    highLevelDescription,
    aesthetics,
    lighting,
    photo,
    medium,
    colorPalette,
    background,
    objects,
  };
}
