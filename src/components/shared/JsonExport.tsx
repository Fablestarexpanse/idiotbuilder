import { useState } from "react";
import { save, open } from "@tauri-apps/plugin-dialog";
import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";
import { usePromptStore } from "../../store/usePromptStore";
import { buildIdeogramJson, parseIdeogramJson } from "../../utils/jsonBuilder";
import "./JsonExport.css";

interface Props {
  onClose: () => void;
}

export function JsonExport({ onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const resolution = usePromptStore((s) => s.resolution);
  const highLevelDescription = usePromptStore((s) => s.highLevelDescription);
  const aesthetics = usePromptStore((s) => s.aesthetics);
  const lighting = usePromptStore((s) => s.lighting);
  const photo = usePromptStore((s) => s.photo);
  const medium = usePromptStore((s) => s.medium);
  const colorPalette = usePromptStore((s) => s.colorPalette);
  const background = usePromptStore((s) => s.background);
  const objects = usePromptStore((s) => s.objects);
  const loadState = usePromptStore((s) => s.loadState);

  const json = JSON.stringify(
    buildIdeogramJson(resolution, highLevelDescription, aesthetics, lighting, photo, medium, colorPalette, background, objects),
    null,
    2,
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      setSaveError(String(e));
    }
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
      loadState(parseIdeogramJson(text));
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
