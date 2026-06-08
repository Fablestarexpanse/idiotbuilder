import { usePromptStore } from "../../store/usePromptStore";
import { RephraseButton } from "../shared/RephraseButton";

const SYSTEM_PROMPT =
  "You are an AI image prompt writer. Name the artistic medium or technique for " +
  "this image. Be specific (e.g. 'Oil on canvas with impasto texture', " +
  "'Pencil sketch on toned paper', 'Unreal Engine 5 cinematic render'). " +
  "Return a short phrase only. No preamble, no labels.";

export function MediumInput() {
  const medium = usePromptStore((s) => s.medium);
  const setMedium = usePromptStore((s) => s.setMedium);

  return (
    <div className="field">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <label style={{ margin: 0 }}>Medium</label>
        <RephraseButton text={medium} onRephrase={setMedium} systemPrompt={SYSTEM_PROMPT} />
      </div>
      <input
        type="text"
        value={medium}
        placeholder="e.g. Mixed-media digital collage"
        onChange={(e) => setMedium(e.target.value)}
      />
    </div>
  );
}
