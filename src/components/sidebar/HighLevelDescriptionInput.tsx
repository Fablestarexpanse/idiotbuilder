import { usePromptStore } from "../../store/usePromptStore";
import { RephraseButton } from "../shared/RephraseButton";

const SYSTEM_PROMPT =
  "You are an AI image prompt writer. Expand the given text into a vivid, " +
  "cinematic high-level scene description for an AI image generator. Include " +
  "primary subjects, setting, and overall visual mood. Return 1-2 sentences " +
  "only. No preamble, no labels.";

export function HighLevelDescriptionInput() {
  const highLevelDescription = usePromptStore((s) => s.highLevelDescription);
  const setHighLevelDescription = usePromptStore((s) => s.setHighLevelDescription);

  return (
    <div className="field">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <label style={{ margin: 0 }}>High-Level Description</label>
        <RephraseButton
          text={highLevelDescription}
          onRephrase={setHighLevelDescription}
          systemPrompt={SYSTEM_PROMPT}
        />
      </div>
      <textarea
        value={highLevelDescription}
        placeholder="Concise summary of the complete scene..."
        onChange={(e) => setHighLevelDescription(e.target.value)}
        rows={2}
      />
    </div>
  );
}
