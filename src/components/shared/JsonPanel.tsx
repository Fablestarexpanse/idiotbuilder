import { useState } from "react";
import { usePromptStore } from "../../store/usePromptStore";
import { buildJson } from "../../utils/jsonBuilder";
import "./JsonPanel.css";

export function JsonPanel() {
  const [copied, setCopied] = useState(false);

  const resolution = usePromptStore((s) => s.resolution);
  const medium = usePromptStore((s) => s.medium);
  const colorPalette = usePromptStore((s) => s.colorPalette);
  const background = usePromptStore((s) => s.background);
  const objects = usePromptStore((s) => s.objects);

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

  return (
    <div className="json-panel">
      <div className="json-panel-header">
        <span className="json-panel-title">JSON Output</span>
        <button className="json-copy-btn" onClick={copy}>
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <pre className="json-panel-body">{json}</pre>
    </div>
  );
}
