import { useState } from "react";
import { usePromptStore } from "../../../store/usePromptStore";
import { getObjectColor } from "../../../utils/colors";
import { ColorSwatch } from "../../shared/ColorSwatch";
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
  const setObjectColorPalette = usePromptStore((s) => s.setObjectColorPalette);

  if (!obj) return null;

  const color = getObjectColor(index);
  const isSelected = selectedObjectId === objectId;
  const objIndex = objects.findIndex((o) => o.id === objectId);
  const isText = obj.type === "text";

  function toggleType() {
    updateObject(objectId, {
      type: isText ? "obj" : "text",
      textContent: isText ? undefined : (obj?.textContent ?? ""),
    });
  }

  function addPaletteColor() {
    const current = obj?.colorPalette ?? [];
    setObjectColorPalette(objectId, [...current, "#888888"]);
  }

  function updatePaletteColor(i: number, hex: string) {
    const current = obj?.colorPalette ?? [];
    setObjectColorPalette(objectId, current.map((c, idx) => (idx === i ? hex : c)));
  }

  function removePaletteColor(i: number) {
    const current = obj?.colorPalette ?? [];
    const next = current.filter((_, idx) => idx !== i);
    setObjectColorPalette(objectId, next.length > 0 ? next : undefined);
  }

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
            {obj.label || (isText ? "text" : "obj")}
          </span>
          <span className={`object-type-badge${isText ? " text-type" : ""}`}>
            {isText ? "txt" : "obj"} z:{obj.zIndex}
          </span>
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
              <button
                className={`type-toggle-btn${isText ? " active" : ""}`}
                onClick={(e) => { e.stopPropagation(); toggleType(); }}
                title={isText ? "Switch to object element" : "Switch to text element"}
              >
                {isText ? "text" : "obj"}
              </button>
            </div>
          </div>

          {/* Text content — only for text elements */}
          {isText && (
            <div className="field">
              <label>Text Content</label>
              <input
                type="text"
                value={obj.textContent ?? ""}
                placeholder="The literal text to display..."
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => updateObject(objectId, { textContent: e.target.value })}
              />
            </div>
          )}

          {/* Z-index */}
          <ZIndexControl objectId={objectId} />

          {/* Bounding box */}
          <BboxInputs objectId={objectId} />

          {/* Description */}
          <div className="field">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <label style={{ margin: 0 }}>{isText ? "Additional description" : "Description"}</label>
              <RephraseButton text={obj.desc} onRephrase={(t) => updateObject(objectId, { desc: t })} />
            </div>
            <textarea
              value={obj.desc}
              placeholder={isText ? "Additional visual description (optional)..." : "Describe this element..."}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => updateObject(objectId, { desc: e.target.value })}
              rows={3}
            />
          </div>

          {/* Per-element color palette */}
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Color Palette</label>
            <div className="global-palette-row">
              {(obj.colorPalette ?? []).map((hex, i) => (
                <ColorSwatch
                  key={i}
                  color={hex}
                  onChange={(c) => updatePaletteColor(i, c)}
                  onRemove={() => removePaletteColor(i)}
                />
              ))}
              <button
                className="add-color-btn"
                onClick={(e) => { e.stopPropagation(); addPaletteColor(); }}
              >
                + color
              </button>
            </div>
          </div>

          <ExtraProperties objectId={objectId} />
        </div>
      )}
    </div>
  );
}
