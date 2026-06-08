import { usePromptStore } from "../../store/usePromptStore";

export function HighLevelDescriptionInput() {
  const highLevelDescription = usePromptStore((s) => s.highLevelDescription);
  const setHighLevelDescription = usePromptStore((s) => s.setHighLevelDescription);

  return (
    <div className="field">
      <label>High-Level Description</label>
      <textarea
        value={highLevelDescription}
        placeholder="Concise summary of the complete scene..."
        onChange={(e) => setHighLevelDescription(e.target.value)}
        rows={2}
      />
    </div>
  );
}
