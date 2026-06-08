import { useEffect, useRef, useState, useCallback } from "react";
import { usePromptStore } from "../../store/usePromptStore";
import { useBuiltJson } from "../../store/useBuiltJson";
import { parseIdeogramJson } from "../../utils/jsonBuilder";
import "./JsonPanel.css";

const DEBOUNCE_MS = 400;
const MIN_WIDTH = 200;
const MAX_WIDTH = 800;
const DEFAULT_WIDTH = 280;

export function JsonPanel() {
  const loadState = usePromptStore((s) => s.loadState);
  const builtJson = useBuiltJson();

  const [localJson, setLocalJson] = useState(builtJson);
  const [parseError, setParseError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);

  const isEditingRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number | null>(null);
  const dragStartWidth = useRef<number>(DEFAULT_WIDTH);

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
      setLocalJson(builtJson);
      setParseError(null);
    }
  }

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

  // ── Resize drag handle ──────────────────────────────────────────────────────

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (dragStartX.current === null) return;
    // Dragging left = larger panel (panel is on the right edge)
    const delta = dragStartX.current - e.clientX;
    const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragStartWidth.current + delta));
    setPanelWidth(next);
  }, []);

  const onMouseUp = useCallback(() => {
    dragStartX.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  }, [onMouseMove]);

  function handleResizeMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    dragStartX.current = e.clientX;
    dragStartWidth.current = panelWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  const lineCount = localJson.split("\n").length;

  return (
    <div className="json-panel" style={{ width: panelWidth, minWidth: panelWidth }}>
      {/* Drag handle on the left edge */}
      <div className="json-resize-handle" onMouseDown={handleResizeMouseDown} title="Drag to resize" />

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
