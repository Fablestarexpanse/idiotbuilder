import { useState } from "react";
import { createPortal } from "react-dom";
import { Sketch } from "@uiw/react-color";
import "./ColorSwatch.css";

interface Props {
  color: string;
  onChange: (hex: string) => void;
  onRemove?: () => void;
  size?: number;
}

export function ColorSwatch({ color, onChange, onRemove, size = 20 }: Props) {
  const [open, setOpen] = useState(false);

  const picker = open
    ? createPortal(
        <div className="color-picker-overlay" onClick={() => setOpen(false)}>
          <div className="color-picker-modal" onClick={(e) => e.stopPropagation()}>
            <Sketch color={color} onChange={(c) => onChange(c.hex)} disableAlpha />
            <div className="color-picker-footer">
              <input
                type="text"
                value={color}
                onChange={(e) => onChange(e.target.value)}
              />
              {onRemove && (
                <button className="btn btn-danger" onClick={() => { onRemove(); setOpen(false); }}>
                  Remove
                </button>
              )}
              <button className="btn btn-primary" onClick={() => setOpen(false)}>
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <div className="color-swatch-wrap">
      <div
        className="color-swatch"
        style={{ width: size, height: size, background: color }}
        onClick={() => setOpen((o) => !o)}
        title={color}
      />
      {picker}
    </div>
  );
}
