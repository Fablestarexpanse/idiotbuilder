import { usePromptStore } from "../../store/usePromptStore";
import { RephraseButton } from "../shared/RephraseButton";

export function BackgroundInput() {
  const background = usePromptStore((s) => s.background);
  const setBackground = usePromptStore((s) => s.setBackground);

  return (
    <div className="field">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <label style={{ margin: 0 }}>Background</label>
        <RephraseButton text={background} onRephrase={setBackground} />
      </div>
      <textarea
        value={background}
        placeholder="Describe the background..."
        onChange={(e) => setBackground(e.target.value)}
        rows={3}
      />
    </div>
  );
}
