import { useState } from "react";
import { usePromptStore } from "../../store/usePromptStore";
import { buildIdeogramJson } from "../../utils/jsonBuilder";
import "./JsonPanel.css";

export function JsonPanel() {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const resolution = usePromptStore((s) => s.resolution);
  const highLevelDescription = usePromptStore((s) => s.highLevelDescription);
  const aesthetics = usePromptStore((s) => s.aesthetics);
  const lighting = usePromptStore((s) => s.lighting);
  const photo = usePromptStore((s) => s.photo);
  const medium = usePromptStore((s) => s.medium);
  const colorPalette = usePromptStore((s) => s.colorPalette);
  const background = usePromptStore((s) => s.background);
  const objects = usePromptStore((s) => s.objects);

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
    } catch {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 1500);
    }
  }

  return (
    <div className="json-panel">
      <div className="json-panel-header">
        <span className="json-panel-title">JSON Output</span>
        <button className="json-copy-btn" onClick={copy}>
          {copied ? "✓ Copied" : copyError ? "Failed" : "Copy"}
        </button>
      </div>
      <pre className="json-panel-body">{json}</pre>
    </div>
  );
}
