import { usePromptStore } from "../../store/usePromptStore";
import { detectPreset } from "../../utils/aspectRatios";
import "./ResolutionControl.css";

export function ResolutionControl() {
  const resolution = usePromptStore((s) => s.resolution);
  const adjustWidth = usePromptStore((s) => s.adjustWidth);
  const adjustHeight = usePromptStore((s) => s.adjustHeight);
  const setResolution = usePromptStore((s) => s.setResolution);

  const preset = detectPreset(resolution);
  const step = 64;

  return (
    <div className="resolution-control field">
      <label>Resolution</label>
      <div className="resolution-row">
        <div className="resolution-axis">
          <button className="icon-btn" onClick={() => adjustWidth(-step)}>−</button>
          <input
            type="number"
            value={resolution.width}
            min={64}
            step={step}
            onChange={(e) => setResolution({ ...resolution, width: Number(e.target.value) })}
          />
          <button className="icon-btn" onClick={() => adjustWidth(step)}>+</button>
        </div>
        <span className="resolution-x">×</span>
        <div className="resolution-axis">
          <button className="icon-btn" onClick={() => adjustHeight(-step)}>−</button>
          <input
            type="number"
            value={resolution.height}
            min={64}
            step={step}
            onChange={(e) => setResolution({ ...resolution, height: Number(e.target.value) })}
          />
          <button className="icon-btn" onClick={() => adjustHeight(step)}>+</button>
        </div>
      </div>
      {preset && <div className="resolution-preset-label">{preset}</div>}
    </div>
  );
}
