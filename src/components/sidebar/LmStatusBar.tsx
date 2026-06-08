import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { usePromptStore } from "../../store/usePromptStore";
import "./LmStatusBar.css";

type Status = "checking" | "connected" | "disconnected";

const POLL_MS = 5000;

interface Props {
  onOpenSettings: () => void;
}

export function LmStatusBar({ onOpenSettings }: Props) {
  const lmSettings = usePromptStore((s) => s.lmSettings);
  const setLmSettings = usePromptStore((s) => s.setLmSettings);
  const [status, setStatus] = useState<Status>("checking");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function check() {
    setStatus("checking");
    try {
      const models = await invoke<string[]>("list_models", { baseUrl: lmSettings.baseUrl });
      setStatus("connected");
      // Auto-update stored model if the current one isn't loaded
      if (models.length > 0 && !models.includes(lmSettings.model)) {
        setLmSettings({ ...lmSettings, model: models[0] });
      }
    } catch {
      setStatus("disconnected");
    }
  }

  useEffect(() => {
    check();
    timerRef.current = setInterval(check, POLL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [lmSettings.baseUrl]);

  const modelName = lmSettings.model || "—";

  return (
    <div className="lm-status-bar" title="Open LM Studio settings" onClick={onOpenSettings}>
      <span className={`lm-dot lm-dot--${status}`} />
      <span className="lm-model-name" title={modelName}>{modelName}</span>
    </div>
  );
}
