import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";
import { usePromptStore } from "../../store/usePromptStore";

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif", "bmp"] as const;

function extToMime(ext: string): string {
  switch (ext) {
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "webp": return "image/webp";
    case "gif": return "image/gif";
    case "bmp": return "image/bmp";
    default: return "image/png";
  }
}

/**
 * Manages the reference image overlay for CanvasPanel.
 * Handles import (via Tauri dialog), resolution auto-detection, and clearing.
 */
export function useReferenceImage() {
  const canvasBgImage = usePromptStore((s) => s.canvasBgImage);
  const canvasBgOpacity = usePromptStore((s) => s.canvasBgOpacity);
  const setCanvasBgImage = usePromptStore((s) => s.setCanvasBgImage);
  const setCanvasBgOpacity = usePromptStore((s) => s.setCanvasBgOpacity);
  const setResolution = usePromptStore((s) => s.setResolution);

  const [bgError, setBgError] = useState<string | null>(null);

  async function importBgImage() {
    setBgError(null);
    try {
      const path = await open({
        filters: [{ name: "Image", extensions: [...IMAGE_EXTENSIONS] }],
        multiple: false,
        directory: false,
      });
      if (!path || Array.isArray(path)) return;

      const bytes = await readFile(path);
      const ext = path.split(".").pop()?.toLowerCase() ?? "png";
      const mime = extToMime(ext);

      const blob = new Blob([bytes], { type: mime });
      if (canvasBgImage) URL.revokeObjectURL(canvasBgImage);
      const url = URL.createObjectURL(blob);

      const img = new Image();
      img.onload = () => {
        setCanvasBgImage(url);
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          setResolution({ width: img.naturalWidth, height: img.naturalHeight });
        }
      };
      img.onerror = () => {
        setBgError("Could not read image dimensions.");
        setCanvasBgImage(url);
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

  return { canvasBgImage, canvasBgOpacity, setCanvasBgOpacity, bgError, importBgImage, clearBgImage };
}
