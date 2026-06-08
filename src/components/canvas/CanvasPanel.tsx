import { useCallback, useEffect, useRef, useState } from "react";
import { usePromptStore } from "../../store/usePromptStore";
import { getObjectColor } from "../../utils/colors";
import { useCanvasDraw } from "./useCanvasDraw";
import { useReferenceImage } from "./useReferenceImage";
import "./CanvasPanel.css";

const PADDING = 40;

function computeFrame(panel: HTMLElement, resolution: { width: number; height: number }) {
  const { width, height } = panel.getBoundingClientRect();
  const availW = width - PADDING * 2;
  const availH = height - PADDING * 2;
  const aspect = resolution.width / resolution.height;
  let fw: number, fh: number;
  if (availW / availH > aspect) {
    fh = availH;
    fw = availH * aspect;
  } else {
    fw = availW;
    fh = availW / aspect;
  }
  return { w: Math.max(1, Math.floor(fw)), h: Math.max(1, Math.floor(fh)) };
}

export function CanvasPanel() {
  const resolution = usePromptStore((s) => s.resolution);
  const objects = usePromptStore((s) => s.objects);
  const selectedObjectId = usePromptStore((s) => s.selectedObjectId);
  const selectObject = usePromptStore((s) => s.selectObject);

  const panelRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frame, setFrame] = useState({ w: 400, h: 600 });

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const ro = new ResizeObserver(() => setFrame(computeFrame(panel, resolution)));
    ro.observe(panel);
    setFrame(computeFrame(panel, resolution));
    return () => ro.disconnect();
  }, [resolution]);

  const toPixelX = useCallback((cx: number) => (cx / resolution.width) * frame.w, [frame.w, resolution.width]);
  const toPixelY = useCallback((cy: number) => (cy / resolution.height) * frame.h, [frame.h, resolution.height]);

  const { handleMouseDown, handleMouseMove, handleMouseUp, drawingObjectId } = useCanvasDraw({
    frameW: frame.w,
    frameH: frame.h,
    canvasRef,
  });

  const {
    canvasBgImage, canvasBgOpacity, setCanvasBgOpacity,
    bgError, importBgImage, clearBgImage,
  } = useReferenceImage();

  return (
    <div className="canvas-panel" ref={panelRef}>
      <div className="canvas-frame" style={{ width: frame.w, height: frame.h }}>
        {/* Reference image layer */}
        {canvasBgImage && (
          <img
            className="canvas-bg-image"
            src={canvasBgImage}
            style={{ opacity: canvasBgOpacity }}
            alt=""
            draggable={false}
          />
        )}

        {/* SVG overlay — finalized bboxes */}
        <svg
          className="bbox-svg"
          width={frame.w}
          height={frame.h}
          onClick={(e) => { if (!drawingObjectId && e.target === e.currentTarget) selectObject(null); }}
        >
          {objects.map((obj, i) => {
            const [x1, y1, x2, y2] = obj.bbox;
            const px = toPixelX(x1);
            const py = toPixelY(y1);
            const pw = toPixelX(x2) - px;
            const ph = toPixelY(y2) - py;
            const color = getObjectColor(i);
            const isSelected = obj.id === selectedObjectId;
            return (
              <g
                key={obj.id}
                onClick={(e) => { e.stopPropagation(); selectObject(obj.id); }}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x={px} y={py} width={pw} height={ph}
                  fill={color + "28"}
                  stroke={color}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />
                <text
                  x={px + 6} y={py + 15}
                  fill={color}
                  fontSize={11}
                  fontWeight={600}
                  fontFamily="monospace"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {obj.label || "obj"} z:{obj.zIndex}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Canvas — live drag preview only */}
        <canvas
          ref={canvasRef}
          className="draw-canvas"
          width={frame.w}
          height={frame.h}
          style={{ cursor: drawingObjectId ? "crosshair" : "default" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
      </div>

      {/* Image controls */}
      <div className="canvas-bg-controls">
        {canvasBgImage ? (
          <>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={canvasBgOpacity}
              onChange={(e) => setCanvasBgOpacity(Number(e.target.value))}
              className="canvas-bg-slider"
              title="Reference image opacity"
            />
            <button className="canvas-bg-btn" onClick={importBgImage} title="Replace image">⤴</button>
            <button className="canvas-bg-btn canvas-bg-btn--remove" onClick={clearBgImage} title="Remove image">✕</button>
          </>
        ) : (
          <button className="canvas-bg-btn canvas-bg-btn--import" onClick={importBgImage}>
            + reference image
          </button>
        )}
        {bgError && <span className="canvas-bg-error">{bgError}</span>}
      </div>

      <div className="canvas-resolution-label">
        {resolution.width} × {resolution.height}
      </div>
    </div>
  );
}
