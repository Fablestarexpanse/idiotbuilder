import { useState } from "react";
import { usePromptStore } from "../../../store/usePromptStore";
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

  if (!obj) return null;

  return (
    <div className="extra-props">
      <button className="extra-props-toggle" onClick={() => setOpen((o) => !o)}>
        Extra properties {open ? "▲" : "▼"}
      </button>

      {open && (
        <div className="extra-props-body">
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
            <button className="btn" onClick={() => addExtraProp(objectId)}>+ custom prop</button>
          </div>
        </div>
      )}
    </div>
  );
}
