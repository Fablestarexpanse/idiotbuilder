import { useState } from "react";
import { usePromptStore } from "../../store/usePromptStore";

interface Props {
  onClose: () => void;
}

export function SettingsModal({ onClose }: Props) {
  const lmSettings = usePromptStore((s) => s.lmSettings);
  const setLmSettings = usePromptStore((s) => s.setLmSettings);

  const [baseUrl, setBaseUrl] = useState(lmSettings.baseUrl);
  const [model, setModel] = useState(lmSettings.model);

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
          <label>Model name</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="local-model"
          />
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}
