import { usePromptStore } from "../../store/usePromptStore";
import { AspectRatioPreset } from "../../types/prompt";
import { PRESET_LABELS, detectPreset } from "../../utils/aspectRatios";
import "./AspectRatioPresets.css";

export function AspectRatioPresets() {
  const resolution = usePromptStore((s) => s.resolution);
  const setAspectRatio = usePromptStore((s) => s.setAspectRatio);
  const current = detectPreset(resolution);

  return (
    <div className="aspect-presets field">
      <label>Aspect Ratio</label>
      <div className="aspect-presets-row">
        {PRESET_LABELS.map((p) => (
          <button
            key={p}
            className={`aspect-btn${current === p ? " active" : ""}`}
            onClick={() => setAspectRatio(p as AspectRatioPreset)}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
