import { usePromptStore } from "../../../store/usePromptStore";
import { BoundingBox } from "../../../types/prompt";
import "./BboxInputs.css";

interface Props {
  objectId: string;
}

export function BboxInputs({ objectId }: Props) {
  const obj = usePromptStore((s) => s.objects.find((o) => o.id === objectId));
  const updateObject = usePromptStore((s) => s.updateObject);
  const drawingObjectId = usePromptStore((s) => s.drawingObjectId);
  const startDrawing = usePromptStore((s) => s.startDrawing);
  const stopDrawing = usePromptStore((s) => s.stopDrawing);

  if (!obj) return null;

  const isDrawing = drawingObjectId === objectId;

  function updateCoord(i: number, val: number) {
    if (!obj) return;
    const next = [...obj.bbox] as BoundingBox;
    next[i] = val;
    updateObject(objectId, { bbox: next });
  }

  const labels = ["x1", "y1", "x2", "y2"];

  return (
    <div className="field">
      <label>Bounding Box [x1, y1, x2, y2]</label>
      <div className="bbox-inputs">
        {obj.bbox.map((val, i) => (
          <input
            key={i}
            type="number"
            value={val}
            title={labels[i]}
            placeholder={labels[i]}
            onChange={(e) => updateCoord(i, Number(e.target.value))}
          />
        ))}
      </div>
      <button
        className={`draw-btn${isDrawing ? " active" : ""}`}
        onClick={() => isDrawing ? stopDrawing() : startDrawing(objectId)}
      >
        {isDrawing ? "Cancel drawing" : "Draw on canvas"}
      </button>
    </div>
  );
}
