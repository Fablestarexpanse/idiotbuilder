import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { usePromptStore } from "../../store/usePromptStore";
import "./LmStatus.css";

type Status = "checking" | "connected" | "disconnected";

const POLL_INTERVAL_MS = 5000;

export function LmStatus() {
  const baseUrl = usePromptStore((s) => s.lmSettings.baseUrl);
  const [status, setStatus] = useState<Status>("checking");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function check() {
    setStatus("checking");
    try {
      await invoke("ping_lm", { baseUrl });
      setStatus("connected");
    } catch {
      setStatus("disconnected");
    }
  }

  useEffect(() => {
    check();
    timerRef.current = setInterval(check, POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [baseUrl]);

  const label =
    status === "connected" ? "LM Studio connected"
    : status === "disconnected" ? "LM Studio not reachable"
    : "Checking LM Studio…";

  return (
    <div className="lm-status" title={label} onClick={check}>
      <span className={`lm-status-dot lm-status-dot--${status}`} />
      <span className="lm-status-label">{label}</span>
    </div>
  );
}
