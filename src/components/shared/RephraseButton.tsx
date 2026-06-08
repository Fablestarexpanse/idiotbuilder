import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { usePromptStore } from "../../store/usePromptStore";
import "./RephraseButton.css";

interface Props {
  text: string;
  onRephrase: (newText: string) => void;
}

export function RephraseButton({ text, onRephrase }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lmSettings = usePromptStore((s) => s.lmSettings);

  async function handleRephrase() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<string>("rephrase", {
        prompt: text,
        baseUrl: lmSettings.baseUrl,
        model: lmSettings.model,
      });
      onRephrase(result);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className={`rephrase-btn${loading ? " loading" : ""}`}
      onClick={handleRephrase}
      disabled={loading || !text.trim()}
      title={error ?? "Rephrase with LM Studio"}
    >
      {loading ? "…" : "✦"}
    </button>
  );
}
