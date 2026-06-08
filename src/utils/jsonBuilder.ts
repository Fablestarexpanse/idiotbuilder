import { PromptObject, Resolution } from "../types/prompt";

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

export function buildJson(
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
