import { useCallback, useEffect, useRef } from "react";
import { usePromptStore } from "../../store/usePromptStore";
import { getObjectColor } from "../../utils/colors";
import { BoundingBox } from "../../types/prompt";

interface DragState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface UseCanvasDrawParams {
  frameW: number;
  frameH: number;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

/**
 * Encapsulates all bbox draw-drag logic for CanvasPanel.
 * Returns event handlers to attach to the draw canvas element.
 */
export function useCanvasDraw({ frameW, frameH, canvasRef }: UseCanvasDrawParams) {
  const resolution = usePromptStore((s) => s.resolution);
  const objects = usePromptStore((s) => s.objects);
  const drawingObjectId = usePromptStore((s) => s.drawingObjectId);
  const updateObject = usePromptStore((s) => s.updateObject);
  const stopDrawing = usePromptStore((s) => s.stopDrawing);

  const dragRef = useRef<DragState | null>(null);

  const toPromptX = useCallback(
    (px: number) => Math.round((px / frameW) * resolution.width),
    [frameW, resolution.width],
  );
  const toPromptY = useCallback(
    (py: number) => Math.round((py / frameH) * resolution.height),
    [frameH, resolution.height],
  );

  function getRelativePos(e: React.MouseEvent): { x: number; y: number } {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function drawPreview(drag: DragState) {
    const canvas = canvasRef.current;
    if (!canvas || !drawingObjectId) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, frameW, frameH);
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
    ctx?.clearRect(0, 0, frameW, frameH);
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

  // Escape key cancels drawing
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

  return { handleMouseDown, handleMouseMove, handleMouseUp, drawingObjectId };
}
