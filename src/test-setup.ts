import "@testing-library/jest-dom";

// Zustand's persist middleware writes to localStorage.
// Provide a simple in-memory implementation for tests.
const localStorageMap = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (key: string) => localStorageMap.get(key) ?? null,
  setItem: (key: string, value: string) => localStorageMap.set(key, value),
  removeItem: (key: string) => localStorageMap.delete(key),
  clear: () => localStorageMap.clear(),
  get length() { return localStorageMap.size; },
  key: (i: number) => [...localStorageMap.keys()][i] ?? null,
});

// Mock Tauri core — components call invoke() which doesn't exist in jsdom
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

// Mock Tauri fs plugin used by CanvasPanel for reference image import
vi.mock("@tauri-apps/plugin-fs", () => ({
  readFile: vi.fn().mockResolvedValue(new Uint8Array()),
}));

// Mock Tauri dialog plugin used by JsonExport for save/open dialogs
vi.mock("@tauri-apps/plugin-dialog", () => ({
  save: vi.fn().mockResolvedValue(null),
  open: vi.fn().mockResolvedValue(null),
}));
