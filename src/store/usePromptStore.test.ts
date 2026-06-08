import { describe, it, expect, beforeEach } from "vitest";
import { usePromptStore } from "./usePromptStore";
import { DEFAULT_LM_BASE_URL, DEFAULT_LM_MODEL } from "../utils/constants";

/** Reset store to initial state before each test so tests are independent. */
function resetStore() {
  usePromptStore.setState({
    resolution: { width: 896, height: 1152 },
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

describe("usePromptStore — resolution", () => {
  beforeEach(resetStore);

  it("setResolution updates width and height", () => {
    usePromptStore.getState().setResolution({ width: 512, height: 512 });
    expect(usePromptStore.getState().resolution).toEqual({ width: 512, height: 512 });
  });

  it("adjustWidth clamps at 64", () => {
    usePromptStore.getState().setResolution({ width: 64, height: 512 });
    usePromptStore.getState().adjustWidth(-9999);
    expect(usePromptStore.getState().resolution.width).toBe(64);
  });

  it("adjustHeight clamps at 64", () => {
    usePromptStore.getState().setResolution({ width: 512, height: 100 });
    usePromptStore.getState().adjustHeight(-9999);
    expect(usePromptStore.getState().resolution.height).toBe(64);
  });

  it("adjustWidth increases resolution", () => {
    usePromptStore.getState().setResolution({ width: 512, height: 512 });
    usePromptStore.getState().adjustWidth(64);
    expect(usePromptStore.getState().resolution.width).toBe(576);
  });

  it("setAspectRatio switches to a known preset", () => {
    usePromptStore.getState().setAspectRatio("1:1");
    const { width, height } = usePromptStore.getState().resolution;
    expect(width).toBe(height);
    expect(width).toBeGreaterThan(0);
  });
});

describe("usePromptStore — text fields", () => {
  beforeEach(resetStore);

  it("setHighLevelDescription", () => {
    usePromptStore.getState().setHighLevelDescription("a scene");
    expect(usePromptStore.getState().highLevelDescription).toBe("a scene");
  });

  it("setAesthetics", () => {
    usePromptStore.getState().setAesthetics("cinematic");
    expect(usePromptStore.getState().aesthetics).toBe("cinematic");
  });

  it("setLighting", () => {
    usePromptStore.getState().setLighting("golden hour");
    expect(usePromptStore.getState().lighting).toBe("golden hour");
  });

  it("setPhoto", () => {
    usePromptStore.getState().setPhoto("35mm");
    expect(usePromptStore.getState().photo).toBe("35mm");
  });

  it("setMedium", () => {
    usePromptStore.getState().setMedium("oil painting");
    expect(usePromptStore.getState().medium).toBe("oil painting");
  });

  it("setBackground", () => {
    usePromptStore.getState().setBackground("dark sky");
    expect(usePromptStore.getState().background).toBe("dark sky");
  });
});

describe("usePromptStore — global color palette", () => {
  beforeEach(resetStore);

  it("addGlobalColor appends a hex", () => {
    usePromptStore.getState().addGlobalColor("#ff0000");
    expect(usePromptStore.getState().colorPalette).toEqual(["#ff0000"]);
  });

  it("removeGlobalColor removes by index", () => {
    usePromptStore.getState().addGlobalColor("#ff0000");
    usePromptStore.getState().addGlobalColor("#00ff00");
    usePromptStore.getState().removeGlobalColor(0);
    expect(usePromptStore.getState().colorPalette).toEqual(["#00ff00"]);
  });

  it("updateGlobalColor replaces at index", () => {
    usePromptStore.getState().addGlobalColor("#ff0000");
    usePromptStore.getState().updateGlobalColor(0, "#0000ff");
    expect(usePromptStore.getState().colorPalette).toEqual(["#0000ff"]);
  });
});

describe("usePromptStore — objects", () => {
  beforeEach(resetStore);

  it("addObject creates an object and selects it", () => {
    usePromptStore.getState().addObject();
    const { objects, selectedObjectId } = usePromptStore.getState();
    expect(objects).toHaveLength(1);
    expect(selectedObjectId).toBe(objects[0].id);
  });

  it("addObject assigns incrementing zIndex", () => {
    usePromptStore.getState().addObject();
    usePromptStore.getState().addObject();
    const { objects } = usePromptStore.getState();
    expect(objects[0].zIndex).toBe(1);
    expect(objects[1].zIndex).toBe(2);
  });

  it("removeObject deletes and clears selection if selected", () => {
    usePromptStore.getState().addObject();
    const id = usePromptStore.getState().objects[0].id;
    usePromptStore.getState().removeObject(id);
    expect(usePromptStore.getState().objects).toHaveLength(0);
    expect(usePromptStore.getState().selectedObjectId).toBeNull();
  });

  it("removeObject keeps selection of a different object", () => {
    usePromptStore.getState().addObject();
    usePromptStore.getState().addObject();
    const [a, b] = usePromptStore.getState().objects;
    usePromptStore.getState().selectObject(b.id);
    usePromptStore.getState().removeObject(a.id);
    expect(usePromptStore.getState().selectedObjectId).toBe(b.id);
  });

  it("updateObject patches the matching object only", () => {
    usePromptStore.getState().addObject();
    usePromptStore.getState().addObject();
    const [a] = usePromptStore.getState().objects;
    usePromptStore.getState().updateObject(a.id, { desc: "updated" });
    expect(usePromptStore.getState().objects[0].desc).toBe("updated");
    expect(usePromptStore.getState().objects[1].desc).toBe("");
  });

  it("reorderObject up swaps with previous", () => {
    usePromptStore.getState().addObject();
    usePromptStore.getState().addObject();
    const [a, b] = usePromptStore.getState().objects;
    usePromptStore.getState().reorderObject(b.id, "up");
    const reordered = usePromptStore.getState().objects;
    expect(reordered[0].id).toBe(b.id);
    expect(reordered[1].id).toBe(a.id);
  });

  it("reorderObject down swaps with next", () => {
    usePromptStore.getState().addObject();
    usePromptStore.getState().addObject();
    const [a, b] = usePromptStore.getState().objects;
    usePromptStore.getState().reorderObject(a.id, "down");
    const reordered = usePromptStore.getState().objects;
    expect(reordered[0].id).toBe(b.id);
    expect(reordered[1].id).toBe(a.id);
  });

  it("reorderObject up at index 0 is a no-op", () => {
    usePromptStore.getState().addObject();
    const [a] = usePromptStore.getState().objects;
    usePromptStore.getState().reorderObject(a.id, "up");
    expect(usePromptStore.getState().objects[0].id).toBe(a.id);
  });

  it("selectObject sets selectedObjectId", () => {
    usePromptStore.getState().addObject();
    const id = usePromptStore.getState().objects[0].id;
    usePromptStore.getState().selectObject(null);
    expect(usePromptStore.getState().selectedObjectId).toBeNull();
    usePromptStore.getState().selectObject(id);
    expect(usePromptStore.getState().selectedObjectId).toBe(id);
  });

  it("selectAndDrawObject sets both IDs", () => {
    usePromptStore.getState().addObject();
    const id = usePromptStore.getState().objects[0].id;
    usePromptStore.getState().selectAndDrawObject(id);
    const s = usePromptStore.getState();
    expect(s.selectedObjectId).toBe(id);
    expect(s.drawingObjectId).toBe(id);
  });

  it("stopDrawing clears drawingObjectId only", () => {
    usePromptStore.getState().addObject();
    const id = usePromptStore.getState().objects[0].id;
    usePromptStore.getState().selectAndDrawObject(id);
    usePromptStore.getState().stopDrawing();
    expect(usePromptStore.getState().drawingObjectId).toBeNull();
    expect(usePromptStore.getState().selectedObjectId).toBe(id);
  });
});

describe("usePromptStore — extra props", () => {
  beforeEach(resetStore);

  it("addExtraProp adds a blank prop to the object", () => {
    usePromptStore.getState().addObject();
    const id = usePromptStore.getState().objects[0].id;
    usePromptStore.getState().addExtraProp(id);
    expect(usePromptStore.getState().objects[0].extraProps).toHaveLength(1);
  });

  it("updateExtraProp patches the matching prop", () => {
    usePromptStore.getState().addObject();
    const id = usePromptStore.getState().objects[0].id;
    usePromptStore.getState().addExtraProp(id);
    const propId = usePromptStore.getState().objects[0].extraProps[0].id;
    usePromptStore.getState().updateExtraProp(id, propId, { key: "mood", value: "tense" });
    const prop = usePromptStore.getState().objects[0].extraProps[0];
    expect(prop.key).toBe("mood");
    expect(prop.value).toBe("tense");
  });

  it("removeExtraProp deletes the matching prop", () => {
    usePromptStore.getState().addObject();
    const id = usePromptStore.getState().objects[0].id;
    usePromptStore.getState().addExtraProp(id);
    const propId = usePromptStore.getState().objects[0].extraProps[0].id;
    usePromptStore.getState().removeExtraProp(id, propId);
    expect(usePromptStore.getState().objects[0].extraProps).toHaveLength(0);
  });
});

describe("usePromptStore — object color palette", () => {
  beforeEach(resetStore);

  it("setObjectColorPalette sets array palette", () => {
    usePromptStore.getState().addObject();
    const id = usePromptStore.getState().objects[0].id;
    usePromptStore.getState().setObjectColorPalette(id, ["#aabbcc"]);
    expect(usePromptStore.getState().objects[0].colorPalette).toEqual(["#aabbcc"]);
  });

  it("setObjectColorPalette accepts undefined to clear palette", () => {
    usePromptStore.getState().addObject();
    const id = usePromptStore.getState().objects[0].id;
    usePromptStore.getState().setObjectColorPalette(id, ["#aabbcc"]);
    usePromptStore.getState().setObjectColorPalette(id, undefined);
    expect(usePromptStore.getState().objects[0].colorPalette).toBeUndefined();
  });
});

describe("usePromptStore — LM settings", () => {
  beforeEach(resetStore);

  it("has default LM settings from constants", () => {
    const { lmSettings } = usePromptStore.getState();
    expect(lmSettings.baseUrl).toBe(DEFAULT_LM_BASE_URL);
    expect(lmSettings.model).toBe(DEFAULT_LM_MODEL);
  });

  it("setLmSettings updates both fields", () => {
    usePromptStore.getState().setLmSettings({ baseUrl: "http://example.com", model: "gpt-x" });
    const { lmSettings } = usePromptStore.getState();
    expect(lmSettings.baseUrl).toBe("http://example.com");
    expect(lmSettings.model).toBe("gpt-x");
  });
});

describe("usePromptStore — canvas background", () => {
  beforeEach(resetStore);

  it("setCanvasBgImage updates url", () => {
    usePromptStore.getState().setCanvasBgImage("blob:http://localhost/abc");
    expect(usePromptStore.getState().canvasBgImage).toBe("blob:http://localhost/abc");
  });

  it("setCanvasBgImage accepts null to clear", () => {
    usePromptStore.getState().setCanvasBgImage("blob:something");
    usePromptStore.getState().setCanvasBgImage(null);
    expect(usePromptStore.getState().canvasBgImage).toBeNull();
  });

  it("setCanvasBgOpacity updates opacity", () => {
    usePromptStore.getState().setCanvasBgOpacity(0.75);
    expect(usePromptStore.getState().canvasBgOpacity).toBe(0.75);
  });
});
