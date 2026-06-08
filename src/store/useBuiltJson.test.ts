import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useBuiltJson } from "./useBuiltJson";
import { usePromptStore } from "./usePromptStore";
import { DEFAULT_LM_BASE_URL, DEFAULT_LM_MODEL } from "../utils/constants";

const DEFAULT_WIDTH = 896;
const DEFAULT_HEIGHT = 1152;

function resetStore() {
  usePromptStore.setState({
    resolution: { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT },
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
    lmSettings: { baseUrl: DEFAULT_LM_BASE_URL, model: DEFAULT_LM_MODEL },
  });
}

describe("useBuiltJson", () => {
  beforeEach(resetStore);

  it("returns a valid JSON string", () => {
    const { result } = renderHook(() => useBuiltJson());
    expect(() => JSON.parse(result.current)).not.toThrow();
  });

  it("output contains high_level_description from store", () => {
    usePromptStore.getState().setHighLevelDescription("A dramatic scene");
    const { result } = renderHook(() => useBuiltJson());
    const parsed = JSON.parse(result.current);
    expect(parsed.high_level_description).toBe("A dramatic scene");
  });

  it("output contains style_description with medium", () => {
    usePromptStore.getState().setMedium("watercolour");
    const { result } = renderHook(() => useBuiltJson());
    const parsed = JSON.parse(result.current);
    expect(parsed.style_description.medium).toBe("watercolour");
  });

  it("output has compositional_deconstruction with empty elements by default", () => {
    const { result } = renderHook(() => useBuiltJson());
    const parsed = JSON.parse(result.current);
    expect(parsed.compositional_deconstruction.elements).toEqual([]);
  });

  it("output includes objects added to store", () => {
    usePromptStore.getState().addObject();
    const id = usePromptStore.getState().objects[0].id;
    usePromptStore.getState().updateObject(id, { label: "hero", desc: "Main character" });
    const { result } = renderHook(() => useBuiltJson());
    const parsed = JSON.parse(result.current);
    expect(parsed.compositional_deconstruction.elements).toHaveLength(1);
    expect(parsed.compositional_deconstruction.elements[0].label).toBe("hero");
  });

  it("updates reactively when store changes", () => {
    const { result, rerender } = renderHook(() => useBuiltJson());
    const before = JSON.parse(result.current);
    expect(before.style_description.medium).toBe("");

    usePromptStore.getState().setMedium("oil painting");
    rerender();

    const after = JSON.parse(result.current);
    expect(after.style_description.medium).toBe("oil painting");
  });
});
