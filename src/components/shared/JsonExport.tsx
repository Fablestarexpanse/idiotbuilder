import { useState } from "react";
import { save, open } from "@tauri-apps/plugin-dialog";
import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";
import { usePromptStore } from "../../store/usePromptStore";
import { useBuiltJson } from "../../store/useBuiltJson";
import { parseIdeogramJson } from "../../utils/jsonBuilder";
import "./JsonExport.css";

interface Props {
  onClose: () => void;
}

export function JsonExport({ onClose }: Props) {
  const loadState = usePromptStore((s) => s.loadState);
  const json = useBuiltJson();

  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);

  async function copy() {
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      setCopyError(String(e));
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
    setOpenError(null);
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
      setOpenError(String(e));
    }
  }

  const anyError = copyError ?? saveError ?? openError;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal json-export-modal" onClick={(e) => e.stopPropagation()}>
        <h2>JSON Output</h2>
        <textarea className="json-output" value={json} readOnly rows={16} />
        {anyError && <div className="save-error">{anyError}</div>}
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
