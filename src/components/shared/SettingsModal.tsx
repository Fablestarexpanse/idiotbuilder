import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { usePromptStore } from "../../store/usePromptStore";

interface Props {
  onClose: () => void;
}

export function SettingsModal({ onClose }: Props) {
  const lmSettings = usePromptStore((s) => s.lmSettings);
  const setLmSettings = usePromptStore((s) => s.setLmSettings);

  const [baseUrl, setBaseUrl] = useState(lmSettings.baseUrl);
  const [model, setModel] = useState(lmSettings.model);
  const [models, setModels] = useState<string[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);

  async function detect() {
    setDetecting(true);
    setDetectError(null);
    setModels([]);
    try {
      const found = await invoke<string[]>("list_models", { baseUrl });
      if (found.length === 0) {
        setDetectError("No models found.");
      } else {
        setModels(found);
        setModel(found[0]);
      }
    } catch (e) {
      setDetectError(String(e));
    } finally {
      setDetecting(false);
    }
  }

  function save() {
    setLmSettings({ baseUrl, model });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>LM Studio Settings</h2>

        <div className="field">
          <label>Base URL</label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="http://localhost:1234/v1/chat/completions"
          />
        </div>

        <div className="field">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <label style={{ margin: 0 }}>Model</label>
            <button
              className="btn"
              style={{ fontSize: 11, padding: "2px 8px" }}
              onClick={detect}
              disabled={detecting}
            >
              {detecting ? "Detecting…" : "Auto-detect"}
            </button>
          </div>

          {/* Dropdown when multiple models detected */}
          {models.length > 1 ? (
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={{ width: "100%" }}
            >
              {models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="local-model"
            />
          )}

          {detectError && (
            <div style={{ fontSize: 11, color: "#e08080", marginTop: 4 }}>{detectError}</div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}
