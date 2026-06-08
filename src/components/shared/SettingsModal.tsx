import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { usePromptStore } from "../../store/usePromptStore";
import { DEFAULT_LM_BASE_URL } from "../../utils/constants";
import "./SettingsModal.css";

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
            placeholder={DEFAULT_LM_BASE_URL}
          />
        </div>

        <div className="field">
          <div className="settings-model-header">
            <label>Model</label>
            <button
              className="btn settings-detect-btn"
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
              className="settings-model-select"
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
            <div className="settings-detect-error">{detectError}</div>
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
