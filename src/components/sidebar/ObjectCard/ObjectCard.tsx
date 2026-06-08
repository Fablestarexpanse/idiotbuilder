import { useState } from "react";
import { usePromptStore } from "../../../store/usePromptStore";
import { getObjectColor } from "../../../utils/colors";
import { ZIndexControl } from "./ZIndexControl";
import { BboxInputs } from "./BboxInputs";
import { ExtraProperties } from "./ExtraProperties";
import { RephraseButton } from "../../shared/RephraseButton";
import "./ObjectCard.css";

interface Props {
  objectId: string;
  index: number;
}

export function ObjectCard({ objectId, index }: Props) {
  const [expanded, setExpanded] = useState(true);
  const obj = usePromptStore((s) => s.objects.find((o) => o.id === objectId));
  const objects = usePromptStore((s) => s.objects);
  const selectedObjectId = usePromptStore((s) => s.selectedObjectId);
  const updateObject = usePromptStore((s) => s.updateObject);
  const removeObject = usePromptStore((s) => s.removeObject);
  const reorderObject = usePromptStore((s) => s.reorderObject);
  const selectObject = usePromptStore((s) => s.selectObject);

  if (!obj) return null;

  const color = getObjectColor(index);
  const isSelected = selectedObjectId === objectId;
  const objIndex = objects.findIndex((o) => o.id === objectId);

  return (
    <div
      className={`object-card${isSelected ? " selected" : ""}`}
      onClick={() => selectObject(objectId)}
    >
      <div className="object-card-header">
        <div className="object-color-strip" style={{ background: color }} />

        <div className="object-card-header-left">
          <span className="object-number">#{index + 1}</span>
          <span className="object-label-preview" style={{ color }}>
            {obj.label || "obj"}
          </span>
          <span className="object-z-badge">z:{obj.zIndex}</span>
        </div>

        <div className="object-card-header-right">
          <button
            className="icon-btn"
            onClick={(e) => { e.stopPropagation(); reorderObject(objectId, "up"); }}
            disabled={objIndex === 0}
            title="Move up"
          >↑</button>
          <button
            className="icon-btn"
            onClick={(e) => { e.stopPropagation(); reorderObject(objectId, "down"); }}
            disabled={objIndex === objects.length - 1}
            title="Move down"
          >↓</button>
          <button
            className="icon-btn"
            onClick={(e) => { e.stopPropagation(); setExpanded((x) => !x); }}
            title={expanded ? "Collapse" : "Expand"}
          >{expanded ? "▲" : "▼"}</button>
          <button
            className="icon-btn danger"
            onClick={(e) => { e.stopPropagation(); removeObject(objectId); }}
            title="Delete"
          >✕</button>
        </div>
      </div>

      {expanded && (
        <div className="object-card-body">
          {/* Label + Type on one row */}
          <div className="object-field-row">
            <div className="field">
              <label>Label</label>
              <input
                type="text"
                value={obj.label}
                placeholder="unique label"
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => updateObject(objectId, { label: e.target.value })}
              />
            </div>
            <div className="field" style={{ maxWidth: 70 }}>
              <label>Type</label>
              <select
                value={obj.type}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => updateObject(objectId, { type: e.target.value as "obj" })}
              >
                <option value="obj">obj</option>
              </select>
            </div>
          </div>

          {/* Z-index */}
          <ZIndexControl objectId={objectId} />

          {/* Bounding box */}
          <BboxInputs objectId={objectId} />

          {/* Description */}
          <div className="field" style={{ marginBottom: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <label style={{ margin: 0 }}>Description</label>
              <RephraseButton text={obj.desc} onRephrase={(t) => updateObject(objectId, { desc: t })} />
            </div>
            <textarea
              value={obj.desc}
              placeholder="Describe this element..."
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => updateObject(objectId, { desc: e.target.value })}
              rows={3}
            />
          </div>

          <ExtraProperties objectId={objectId} />
        </div>
      )}
    </div>
  );
}
