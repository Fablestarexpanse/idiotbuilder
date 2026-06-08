import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { usePromptStore } from "../../store/usePromptStore";
import "./RephraseButton.css";

const DEFAULT_SYSTEM_PROMPT =
  "You are a creative writing assistant for AI image generation prompts. " +
  "Rephrase the given text to be more vivid, evocative, and specific. " +
  "Keep it concise (1-3 sentences). Return only the rephrased text, no preamble.";

interface Props {
  text: string;
  onRephrase: (newText: string) => void;
  /** Override the system prompt sent to LM Studio. Defaults to the generic rephrase prompt. */
  systemPrompt?: string;
}

export function RephraseButton({ text, onRephrase, systemPrompt }: Props) {
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
        systemPrompt: systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
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
