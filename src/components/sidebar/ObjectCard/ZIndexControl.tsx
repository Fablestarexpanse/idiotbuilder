import { usePromptStore } from "../../../store/usePromptStore";
import "./ZIndexControl.css";

interface Props {
  objectId: string;
}

export function ZIndexControl({ objectId }: Props) {
  const obj = usePromptStore((s) => s.objects.find((o) => o.id === objectId));
  const updateObject = usePromptStore((s) => s.updateObject);

  if (!obj) return null;

  return (
    <div className="field">
      <label title="Layer order — higher = in front">Z-Index (layer order)</label>
      <div className="z-index-row">
        <button
          className="icon-btn"
          onClick={() => updateObject(objectId, { zIndex: Math.max(1, obj.zIndex - 1) })}
        >−</button>
        <input
          type="number"
          value={obj.zIndex}
          min={1}
          onChange={(e) => updateObject(objectId, { zIndex: Number(e.target.value) })}
        />
        <button className="icon-btn" onClick={() => updateObject(objectId, { zIndex: obj.zIndex + 1 })}>+</button>
      </div>
    </div>
  );
}
