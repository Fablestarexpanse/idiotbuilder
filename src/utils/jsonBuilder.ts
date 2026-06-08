import { ObjectColorPalette, PromptObject, Resolution } from "../types/prompt";

export interface ParsedPromptState {
  resolution: Resolution;
  medium: string;
  colorPalette: string[];
  background: string;
  objects: PromptObject[];
}

interface IdeogramOutput {
  resolution: string;
  medium: string;
  color_palette?: string[];
  compositional_deconstruction: {
    background: string;
    objects: IdeogramObject[];
  };
}

interface IdeogramObject {
  label: string;
  type: "obj";
  "z-index": number;
  bbox: [number, number, number, number];
  desc: string;
  color_palette?: { main: string; secondary: string; tertiary: string };
  [key: string]: unknown;
}

export function buildIdeogramJson(
  resolution: Resolution,
  medium: string,
  colorPalette: string[],
  background: string,
  objects: PromptObject[],
): IdeogramOutput {
  const sorted = [...objects].sort((a, b) => a.zIndex - b.zIndex);

  const outputObjects: IdeogramObject[] = sorted.map((obj) => {
    const out: IdeogramObject = {
      label: obj.label,
      type: obj.type,
      "z-index": obj.zIndex,
      bbox: obj.bbox,
      desc: obj.desc,
    };

    if (obj.colorPalette) {
      out.color_palette = obj.colorPalette;
    }

    for (const ep of obj.extraProps) {
      if (ep.key.trim()) {
        out[ep.key] = ep.value;
      }
    }

    return out;
  });

  return {
    resolution: `${resolution.width}x${resolution.height}`,
    medium,
    ...(colorPalette.length > 0 ? { color_palette: colorPalette } : {}),
    compositional_deconstruction: {
      background,
      objects: outputObjects,
    },
  };
}

/**
 * Parse a saved Ideogram JSON file back into prompt store state.
 * Throws SyntaxError on invalid JSON or TypeError on unexpected shape.
 * Callers are responsible for catching and surfacing errors to the user.
 */
export function parseIdeogramJson(text: string): ParsedPromptState {
  const data = JSON.parse(text) as Record<string, unknown>;
  const resolutionStr = typeof data.resolution === "string" ? data.resolution : "896x1152";
  const [w, h] = resolutionStr.split("x").map(Number);
  const cd = data.compositional_deconstruction as Record<string, unknown> | undefined;
  const rawObjects = Array.isArray(cd?.objects) ? (cd!.objects as Record<string, unknown>[]) : [];
  const objects: PromptObject[] = rawObjects.map((o, idx) => ({
    id: crypto.randomUUID(),
    label: String(o.label ?? "obj"),
    type: "obj" as const,
    zIndex: Number(o["z-index"] ?? idx + 1),
    bbox: (o.bbox as [number, number, number, number]) ?? [0, 0, w, h],
    desc: String(o.desc ?? ""),
    colorPalette: o.color_palette as ObjectColorPalette | undefined,
    extraProps: [],
  }));
  return {
    resolution: { width: w, height: h },
    medium: typeof data.medium === "string" ? data.medium : "",
    colorPalette: Array.isArray(data.color_palette) ? (data.color_palette as string[]) : [],
    background: typeof cd?.background === "string" ? cd.background : "",
    objects,
  };
}
