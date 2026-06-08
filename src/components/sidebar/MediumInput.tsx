import { usePromptStore } from "../../store/usePromptStore";

export function MediumInput() {
  const medium = usePromptStore((s) => s.medium);
  const setMedium = usePromptStore((s) => s.setMedium);

  return (
    <div className="field">
      <label>Medium</label>
      <input
        type="text"
        value={medium}
        placeholder="e.g. Mixed-media digital collage"
        onChange={(e) => setMedium(e.target.value)}
      />
    </div>
  );
}
