import { useState } from "react";
import { usePromptStore } from "../../../store/usePromptStore";
import { ColorSwatch } from "../../shared/ColorSwatch";
import "./ExtraProperties.css";

interface Props {
  objectId: string;
}

export function ExtraProperties({ objectId }: Props) {
  const [open, setOpen] = useState(false);
  const obj = usePromptStore((s) => s.objects.find((o) => o.id === objectId));
  const addExtraProp = usePromptStore((s) => s.addExtraProp);
  const updateExtraProp = usePromptStore((s) => s.updateExtraProp);
  const removeExtraProp = usePromptStore((s) => s.removeExtraProp);
  const setObjectColorPalette = usePromptStore((s) => s.setObjectColorPalette);

  if (!obj) return null;

  function addColorPalette() {
    if (!obj?.colorPalette) {
      setObjectColorPalette(objectId, { main: "#000000", secondary: "#ffffff", tertiary: "#888888" });
    }
  }

  function removeColorPalette() {
    setObjectColorPalette(objectId, undefined);
  }

  return (
    <div className="extra-props">
      <button className="extra-props-toggle" onClick={() => setOpen((o) => !o)}>
        Extra properties {open ? "▲" : "▼"}
      </button>

      {open && (
        <div className="extra-props-body">
          {obj.colorPalette && (
            <div className="field">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ margin: 0 }}>Color Palette</label>
                <button className="icon-btn danger" onClick={removeColorPalette}>✕</button>
              </div>
              <div className="obj-palette">
                {(["main", "secondary", "tertiary"] as const).map((key) => (
                  <div key={key} className="obj-palette-row">
                    <span className="obj-palette-label">{key}</span>
                    <ColorSwatch
                      color={obj.colorPalette![key]}
                      onChange={(c) => setObjectColorPalette(objectId, { ...obj.colorPalette!, [key]: c })}
                      size={18}
                    />
                    <span className="obj-palette-hex">{obj.colorPalette![key]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {obj.extraProps.map((ep) => (
            <div key={ep.id} className="extra-prop-row field">
              <input
                type="text"
                value={ep.key}
                placeholder="key"
                style={{ flex: 1 }}
                onChange={(e) => updateExtraProp(objectId, ep.id, { key: e.target.value })}
              />
              <input
                type="text"
                value={ep.value}
                placeholder="value"
                style={{ flex: 2 }}
                onChange={(e) => updateExtraProp(objectId, ep.id, { value: e.target.value })}
              />
              <button className="icon-btn danger" onClick={() => removeExtraProp(objectId, ep.id)}>✕</button>
            </div>
          ))}

          <div className="extra-props-actions">
            {!obj.colorPalette && (
              <button className="btn" onClick={addColorPalette}>+ color_palette</button>
            )}
            <button className="btn" onClick={() => addExtraProp(objectId)}>+ custom prop</button>
          </div>
        </div>
      )}
    </div>
  );
}
