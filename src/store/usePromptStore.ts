import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import {
  AspectRatioPreset,
  ExtraProperty,
  LmSettings,
  PromptObject,
  Resolution,
} from "../types/prompt";
import { ParsedPromptState } from "../utils/jsonBuilder";
import { ASPECT_RATIO_PRESETS } from "../utils/aspectRatios";
import { DEFAULT_LM_BASE_URL, DEFAULT_LM_MODEL } from "../utils/constants";

interface PromptState {
  resolution: Resolution;
  highLevelDescription: string;
  aesthetics: string;
  lighting: string;
  photo: string;
  medium: string;
  colorPalette: string[];
  background: string;
  objects: PromptObject[];
  selectedObjectId: string | null;
  drawingObjectId: string | null;
  lmSettings: LmSettings;

  /** Object URL for the canvas reference image (not persisted). */
  canvasBgImage: string | null;
  /** Opacity of the canvas reference image, 0–1. */
  canvasBgOpacity: number;

  setResolution: (r: Resolution) => void;
  adjustWidth: (delta: number) => void;
  adjustHeight: (delta: number) => void;
  setAspectRatio: (preset: AspectRatioPreset) => void;
  setHighLevelDescription: (text: string) => void;
  setAesthetics: (text: string) => void;
  setLighting: (text: string) => void;
  setPhoto: (text: string) => void;
  setMedium: (m: string) => void;
  addGlobalColor: (hex: string) => void;
  removeGlobalColor: (index: number) => void;
  updateGlobalColor: (index: number, hex: string) => void;
  setBackground: (text: string) => void;

  addObject: () => void;
  removeObject: (id: string) => void;
  updateObject: (id: string, patch: Partial<Omit<PromptObject, "id">>) => void;
  reorderObject: (id: string, direction: "up" | "down") => void;
  selectObject: (id: string | null) => void;
  /** Selects the object AND enters draw mode — both selectedObjectId and drawingObjectId are set. */
  selectAndDrawObject: (id: string) => void;
  stopDrawing: () => void;

  addExtraProp: (objectId: string) => void;
  updateExtraProp: (objectId: string, propId: string, patch: Partial<ExtraProperty>) => void;
  removeExtraProp: (objectId: string, propId: string) => void;
  setObjectColorPalette: (objectId: string, palette: string[] | undefined) => void;

  setLmSettings: (s: LmSettings) => void;
  loadState: (state: ParsedPromptState) => void;

  setCanvasBgImage: (url: string | null) => void;
  setCanvasBgOpacity: (opacity: number) => void;
}

const DEFAULT_RESOLUTION: Resolution = { width: 896, height: 1152 };

export const usePromptStore = create<PromptState>()(
  persist(
    (set) => ({
      resolution: DEFAULT_RESOLUTION,
      highLevelDescription: "",
      aesthetics: "",
      lighting: "",
      photo: "",
      medium: "",
      colorPalette: [],
      background: "",
      objects: [],
      selectedObjectId: null,
      drawingObjectId: null,
      canvasBgImage: null,
      canvasBgOpacity: 0.4,
      lmSettings: {
        baseUrl: DEFAULT_LM_BASE_URL,
        model: DEFAULT_LM_MODEL,
      },

      setResolution: (r) => set({ resolution: r }),
      adjustWidth: (delta) =>
        set((s) => ({ resolution: { ...s.resolution, width: Math.max(64, s.resolution.width + delta) } })),
      adjustHeight: (delta) =>
        set((s) => ({ resolution: { ...s.resolution, height: Math.max(64, s.resolution.height + delta) } })),
      setAspectRatio: (preset) => set({ resolution: ASPECT_RATIO_PRESETS[preset] }),
      setHighLevelDescription: (text) => set({ highLevelDescription: text }),
      setAesthetics: (text) => set({ aesthetics: text }),
      setLighting: (text) => set({ lighting: text }),
      setPhoto: (text) => set({ photo: text }),
      setMedium: (m) => set({ medium: m }),
      addGlobalColor: (hex) => set((s) => ({ colorPalette: [...s.colorPalette, hex] })),
      removeGlobalColor: (index) =>
        set((s) => ({ colorPalette: s.colorPalette.filter((_, i) => i !== index) })),
      updateGlobalColor: (index, hex) =>
        set((s) => ({ colorPalette: s.colorPalette.map((c, i) => (i === index ? hex : c)) })),
      setBackground: (text) => set({ background: text }),

      addObject: () =>
        set((s) => {
          const newObj: PromptObject = {
            id: uuidv4(),
            label: `obj`,
            type: "obj",
            zIndex: s.objects.length + 1,
            bbox: [0, 0, s.resolution.width, s.resolution.height],
            desc: "",
            extraProps: [],
          };
          return { objects: [...s.objects, newObj], selectedObjectId: newObj.id };
        }),

      removeObject: (id) =>
        set((s) => ({
          objects: s.objects.filter((o) => o.id !== id),
          selectedObjectId: s.selectedObjectId === id ? null : s.selectedObjectId,
          drawingObjectId: s.drawingObjectId === id ? null : s.drawingObjectId,
        })),

      updateObject: (id, patch) =>
        set((s) => ({
          objects: s.objects.map((o) => (o.id === id ? { ...o, ...patch } : o)),
        })),

      reorderObject: (id, direction) =>
        set((s) => {
          const idx = s.objects.findIndex((o) => o.id === id);
          if (idx === -1) return {};
          const next = [...s.objects];
          if (direction === "up" && idx > 0) {
            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
          } else if (direction === "down" && idx < next.length - 1) {
            [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
          }
          return { objects: next };
        }),

      selectObject: (id) => set({ selectedObjectId: id }),
      selectAndDrawObject: (id) => set({ drawingObjectId: id, selectedObjectId: id }),
      stopDrawing: () => set({ drawingObjectId: null }),

      addExtraProp: (objectId) =>
        set((s) => ({
          objects: s.objects.map((o) =>
            o.id === objectId
              ? { ...o, extraProps: [...o.extraProps, { id: uuidv4(), key: "", value: "" }] }
              : o,
          ),
        })),

      updateExtraProp: (objectId, propId, patch) =>
        set((s) => ({
          objects: s.objects.map((o) =>
            o.id === objectId
              ? {
                  ...o,
                  extraProps: o.extraProps.map((p) => (p.id === propId ? { ...p, ...patch } : p)),
                }
              : o,
          ),
        })),

      removeExtraProp: (objectId, propId) =>
        set((s) => ({
          objects: s.objects.map((o) =>
            o.id === objectId
              ? { ...o, extraProps: o.extraProps.filter((p) => p.id !== propId) }
              : o,
          ),
        })),

      setObjectColorPalette: (objectId, palette) =>
        set((s) => ({
          objects: s.objects.map((o) =>
            o.id === objectId ? { ...o, colorPalette: palette } : o,
          ),
        })),

      setLmSettings: (s) => set({ lmSettings: s }),

      loadState: (state) =>
        set({
          resolution: state.resolution,
          highLevelDescription: state.highLevelDescription,
          aesthetics: state.aesthetics,
          lighting: state.lighting,
          photo: state.photo,
          medium: state.medium,
          colorPalette: state.colorPalette,
          background: state.background,
          objects: state.objects,
          selectedObjectId: null,
          drawingObjectId: null,
        }),

      setCanvasBgImage: (url) => set({ canvasBgImage: url }),
      setCanvasBgOpacity: (opacity) => set({ canvasBgOpacity: opacity }),
    }),
    {
      name: "idiotbuilder-prompt",
      // Bump version whenever the persisted shape changes to avoid crashes
      // from stale localStorage data — Zustand will discard the old state
      // and start fresh with defaults.
      version: 2,
      // Never persist the image data URL — it can be hundreds of KB and
      // the object URL becomes invalid across sessions anyway.
      partialize: (s) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { canvasBgImage, canvasBgOpacity, ...rest } = s;
        return rest;
      },
    },
  ),
);
