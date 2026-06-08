import { usePromptStore } from "../../store/usePromptStore";
import { ColorSwatch } from "../shared/ColorSwatch";
import "./GlobalColorPalette.css";

export function GlobalColorPalette() {
  const colorPalette = usePromptStore((s) => s.colorPalette);
  const addGlobalColor = usePromptStore((s) => s.addGlobalColor);
  const removeGlobalColor = usePromptStore((s) => s.removeGlobalColor);
  const updateGlobalColor = usePromptStore((s) => s.updateGlobalColor);

  return (
    <div className="field">
      <label>Color Palette</label>
      <div className="global-palette-row">
        {colorPalette.map((hex, i) => (
          <ColorSwatch
            key={`${hex}-${i}`}
            color={hex}
            onChange={(c) => updateGlobalColor(i, c)}
            onRemove={() => removeGlobalColor(i)}
          />
        ))}
        <button className="add-color-btn" onClick={() => addGlobalColor("#888888")}>
          + color
        </button>
      </div>
    </div>
  );
}
