import { useCallback, useEffect, useRef, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";
import { usePromptStore } from "../../store/usePromptStore";
import { getObjectColor } from "../../utils/colors";
import { BoundingBox } from "../../types/prompt";
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

interface DragState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export function CanvasPanel() {
  const resolution = usePromptStore((s) => s.resolution);
  const objects = usePromptStore((s) => s.objects);
  const selectedObjectId = usePromptStore((s) => s.selectedObjectId);
  const drawingObjectId = usePromptStore((s) => s.drawingObjectId);
  const selectObject = usePromptStore((s) => s.selectObject);
  const updateObject = usePromptStore((s) => s.updateObject);
  const stopDrawing = usePromptStore((s) => s.stopDrawing);
  const canvasBgImage = usePromptStore((s) => s.canvasBgImage);
  const canvasBgOpacity = usePromptStore((s) => s.canvasBgOpacity);
  const setCanvasBgImage = usePromptStore((s) => s.setCanvasBgImage);
  const setCanvasBgOpacity = usePromptStore((s) => s.setCanvasBgOpacity);
  const setResolution = usePromptStore((s) => s.setResolution);

  const [bgError, setBgError] = useState<string | null>(null);

  // Outer panel — tracked for available space
  const panelRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<DragState | null>(null);

  // Computed workspace pixel dimensions
  const [frame, setFrame] = useState({ w: 400, h: 600 });

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const ro = new ResizeObserver(() => setFrame(computeFrame(panel, resolution)));
    ro.observe(panel);
    // Compute immediately so the initial size is correct before the first resize event
    setFrame(computeFrame(panel, resolution));
    return () => ro.disconnect();
  }, [resolution]);

  const toPixelX = useCallback((cx: number) => (cx / resolution.width) * frame.w, [frame.w, resolution.width]);
  const toPixelY = useCallback((cy: number) => (cy / resolution.height) * frame.h, [frame.h, resolution.height]);
  const toPromptX = useCallback((px: number) => Math.round((px / frame.w) * resolution.width), [frame.w, resolution.width]);
  const toPromptY = useCallback((py: number) => Math.round((py / frame.h) * resolution.height), [frame.h, resolution.height]);

  function getRelativePos(e: React.MouseEvent): { x: number; y: number } {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function drawPreview(drag: DragState) {
    const canvas = canvasRef.current;
    if (!canvas || !drawingObjectId) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, frame.w, frame.h);
    const { startX, startY, currentX, currentY } = drag;
    const drawIdx = objects.findIndex((o) => o.id === drawingObjectId);
    const color = getObjectColor(drawIdx);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.fillStyle = color + "33";
    const rx = Math.min(startX, currentX);
    const ry = Math.min(startY, currentY);
    const rw = Math.abs(currentX - startX);
    const rh = Math.abs(currentY - startY);
    ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeRect(rx, ry, rw, rh);
  }

  function clearPreview() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, frame.w, frame.h);
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (!drawingObjectId) return;
    e.preventDefault();
    const { x, y } = getRelativePos(e);
    dragRef.current = { startX: x, startY: y, currentX: x, currentY: y };
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragRef.current || !drawingObjectId) return;
    const { x, y } = getRelativePos(e);
    dragRef.current = { ...dragRef.current, currentX: x, currentY: y };
    drawPreview(dragRef.current);
  }

  function handleMouseUp(e: React.MouseEvent) {
    if (!dragRef.current || !drawingObjectId) return;
    const { x, y } = getRelativePos(e);
    const { startX, startY } = dragRef.current;
    const bbox: BoundingBox = [
      toPromptX(Math.min(startX, x)),
      toPromptY(Math.min(startY, y)),
      toPromptX(Math.max(startX, x)),
      toPromptY(Math.max(startY, y)),
    ];
    updateObject(drawingObjectId, { bbox });
    dragRef.current = null;
    stopDrawing();
    clearPreview();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && drawingObjectId) {
        dragRef.current = null;
        stopDrawing();
        clearPreview();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawingObjectId, stopDrawing]);

  async function importBgImage() {
    setBgError(null);
    try {
      const path = await open({
        filters: [{ name: "Image", extensions: ["png", "jpg", "jpeg", "webp", "gif", "bmp"] }],
        multiple: false,
        directory: false,
      });
      if (!path || Array.isArray(path)) return;

      const bytes = await readFile(path);
      const ext = path.split(".").pop()?.toLowerCase() ?? "png";
      const mime =
        ext === "jpg" || ext === "jpeg" ? "image/jpeg"
        : ext === "webp" ? "image/webp"
        : ext === "gif" ? "image/gif"
        : ext === "bmp" ? "image/bmp"
        : "image/png";

      const blob = new Blob([bytes], { type: mime });
      // Revoke the previous object URL to free memory
      if (canvasBgImage) URL.revokeObjectURL(canvasBgImage);
      const url = URL.createObjectURL(blob);

      // Detect image dimensions and offer to match resolution
      const img = new Image();
      img.onload = () => {
        setCanvasBgImage(url);
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          setResolution({ width: img.naturalWidth, height: img.naturalHeight });
        }
      };
      img.onerror = () => {
        setBgError("Could not read image dimensions.");
        setCanvasBgImage(url); // still show it
      };
      img.src = url;
    } catch (e) {
      setBgError(String(e));
    }
  }

  function clearBgImage() {
    if (canvasBgImage) URL.revokeObjectURL(canvasBgImage);
    setCanvasBgImage(null);
    setBgError(null);
  }

  return (
    <div className="canvas-panel" ref={panelRef}>
      <div
        className="canvas-frame"
        style={{ width: frame.w, height: frame.h }}
      >
        {/* Reference image layer — sits below dot grid and bbox overlay */}
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
              <g key={obj.id} onClick={(e) => { e.stopPropagation(); selectObject(obj.id); }} style={{ cursor: "pointer" }}>
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

      {/* Image controls — shown when an image is loaded, or as an import button */}
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
            <button className="canvas-bg-btn" onClick={importBgImage} title="Replace image">
              ⤴
            </button>
            <button className="canvas-bg-btn canvas-bg-btn--remove" onClick={clearBgImage} title="Remove image">
              ✕
            </button>
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
