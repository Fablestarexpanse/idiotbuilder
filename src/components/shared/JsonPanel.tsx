import { useEffect, useRef, useState } from "react";
import { usePromptStore } from "../../store/usePromptStore";
import { useBuiltJson } from "../../store/useBuiltJson";
import { parseIdeogramJson } from "../../utils/jsonBuilder";
import "./JsonPanel.css";

const DEBOUNCE_MS = 400;

export function JsonPanel() {
  const loadState = usePromptStore((s) => s.loadState);
  const builtJson = useBuiltJson();

  const [localJson, setLocalJson] = useState(builtJson);
  const [parseError, setParseError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  // Tracks whether the user is actively editing so we don't overwrite their work
  const isEditingRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  // Sync store → textarea whenever a sidebar field changes and user isn't editing
  useEffect(() => {
    if (!isEditingRef.current) {
      setLocalJson(builtJson);
      setParseError(null);
    }
  }, [builtJson]);

  function handleChange(value: string) {
    setLocalJson(value);
    isEditingRef.current = true;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      try {
        loadState(parseIdeogramJson(value));
        setParseError(null);
      } catch (e) {
        setParseError(e instanceof SyntaxError ? "Invalid JSON" : String(e));
      }
    }, DEBOUNCE_MS);
  }

  function handleBlur() {
    isEditingRef.current = false;
    if (parseError) {
      // Revert to last known-good state
      setLocalJson(builtJson);
      setParseError(null);
    }
  }

  // Keep gutter scroll in sync with textarea scroll
  function handleScroll() {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(localJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 1500);
    }
  }

  const lineCount = localJson.split("\n").length;

  return (
    <div className="json-panel">
      <div className="json-panel-header">
        <span className="json-panel-title">JSON Output</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {parseError && <span className="json-parse-error" title={parseError}>⚠ invalid</span>}
          <button className="json-copy-btn" onClick={copy}>
            {copied ? "✓ Copied" : copyError ? "Failed" : "Copy"}
          </button>
        </div>
      </div>

      <div className="json-editor">
        {/* Line-number gutter */}
        <div className="json-gutter" ref={gutterRef}>
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} className="json-line-number">{i + 1}</div>
          ))}
        </div>

        {/* Editable textarea */}
        <textarea
          ref={textareaRef}
          className={`json-textarea${parseError ? " json-textarea--error" : ""}`}
          value={localJson}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          onScroll={handleScroll}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>
    </div>
  );
}
