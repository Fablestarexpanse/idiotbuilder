import { useState } from "react";
import { save, open } from "@tauri-apps/plugin-dialog";
import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";
import { usePromptStore } from "../../store/usePromptStore";
import { buildJson } from "../../utils/jsonBuilder";
import "./JsonExport.css";

interface Props {
  onClose: () => void;
}

export function JsonExport({ onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const resolution = usePromptStore((s) => s.resolution);
  const medium = usePromptStore((s) => s.medium);
  const colorPalette = usePromptStore((s) => s.colorPalette);
  const background = usePromptStore((s) => s.background);
  const objects = usePromptStore((s) => s.objects);
  const loadState = usePromptStore((s) => s.loadState);

  const json = JSON.stringify(
    buildJson(resolution, medium, colorPalette, background, objects),
    null,
    2,
  );

  async function copy() {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function saveFile() {
    setSaveError(null);
    try {
      const path = await save({
        defaultPath: "prompt.json",
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (path) await writeTextFile(path, json);
    } catch (e) {
      setSaveError(String(e));
    }
  }

  async function openFile() {
    setSaveError(null);
    try {
      const path = await open({
        filters: [{ name: "JSON", extensions: ["json"] }],
        multiple: false,
        directory: false,
      });
      if (!path || Array.isArray(path)) return;
      const text = await readTextFile(path);
      const data = JSON.parse(text);
      // Parse resolution string "WxH"
      const [w, h] = (data.resolution ?? "896x1152").split("x").map(Number);
      loadState({
        resolution: { width: w, height: h },
        medium: data.medium ?? "",
        colorPalette: data.color_palette ?? [],
        background: data.compositional_deconstruction?.background ?? "",
        objects: (data.compositional_deconstruction?.objects ?? []).map((o: Record<string, unknown>, idx: number) => ({
          id: crypto.randomUUID(),
          label: String(o.label ?? "obj"),
          type: "obj" as const,
          zIndex: Number(o["z-index"] ?? idx + 1),
          bbox: (o.bbox as [number, number, number, number]) ?? [0, 0, w, h],
          desc: String(o.desc ?? ""),
          colorPalette: o.color_palette as { main: string; secondary: string; tertiary: string } | undefined,
          extraProps: [],
        })),
      });
      onClose();
    } catch (e) {
      setSaveError(String(e));
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal json-export-modal" onClick={(e) => e.stopPropagation()}>
        <h2>JSON Output</h2>
        <textarea className="json-output" value={json} readOnly rows={16} />
        {saveError && <div className="save-error">{saveError}</div>}
        <div className="modal-actions">
          <button className="btn" onClick={openFile}>Open JSON</button>
          <button className="btn" onClick={saveFile}>Save JSON</button>
          <button className="btn btn-primary" onClick={copy}>
            {copied ? "Copied!" : "Copy"}
          </button>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
