import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import {
  AspectRatioPreset,
  ExtraProperty,
  LmSettings,
  ObjectColorPalette,
  PromptObject,
  Resolution,
} from "../types/prompt";
import { ASPECT_RATIO_PRESETS } from "../utils/aspectRatios";

interface PromptState {
  resolution: Resolution;
  medium: string;
  colorPalette: string[];
  background: string;
  objects: PromptObject[];
  selectedObjectId: string | null;
  drawingObjectId: string | null;
  lmSettings: LmSettings;

  setResolution: (r: Resolution) => void;
  adjustWidth: (delta: number) => void;
  adjustHeight: (delta: number) => void;
  setAspectRatio: (preset: AspectRatioPreset) => void;
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
  startDrawing: (id: string) => void;
  stopDrawing: () => void;

  addExtraProp: (objectId: string) => void;
  updateExtraProp: (objectId: string, propId: string, patch: Partial<ExtraProperty>) => void;
  removeExtraProp: (objectId: string, propId: string) => void;
  setObjectColorPalette: (objectId: string, palette: ObjectColorPalette | undefined) => void;

  setLmSettings: (s: LmSettings) => void;
  loadState: (state: Partial<PromptState>) => void;
}

const DEFAULT_RESOLUTION: Resolution = { width: 896, height: 1152 };

export const usePromptStore = create<PromptState>()(
  persist(
    (set) => ({
      resolution: DEFAULT_RESOLUTION,
      medium: "",
      colorPalette: [],
      background: "",
      objects: [],
      selectedObjectId: null,
      drawingObjectId: null,
      lmSettings: {
        baseUrl: "http://localhost:1234/v1/chat/completions",
        model: "local-model",
      },

      setResolution: (r) => set({ resolution: r }),
      adjustWidth: (delta) =>
        set((s) => ({ resolution: { ...s.resolution, width: Math.max(64, s.resolution.width + delta) } })),
      adjustHeight: (delta) =>
        set((s) => ({ resolution: { ...s.resolution, height: Math.max(64, s.resolution.height + delta) } })),
      setAspectRatio: (preset) => set({ resolution: ASPECT_RATIO_PRESETS[preset] }),
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
      startDrawing: (id) => set({ drawingObjectId: id, selectedObjectId: id }),
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

      loadState: (state) => set(state),
    }),
    { name: "idiotbuilder-prompt" },
  ),
);
