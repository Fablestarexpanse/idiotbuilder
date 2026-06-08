# Idiotbuilder

**Simple for idiots. Powerful for pros.**

A visual JSON prompt builder for [Ideogram](https://ideogram.ai)'s compositional deconstruction feature. Draw bounding boxes on a canvas, assign z-indices, descriptions, and colour palettes to each element, then export a structured JSON prompt — ready to paste into Ideogram.

![Idiotbuilder screenshot](docs/screenshot.png)

---

## Features

- **Visual canvas** — draw bounding boxes by clicking and dragging; boxes update the JSON live
- **Aspect ratio presets** — 1:1, 3:2, 4:3, 16:9, 21:9, 2:3, 3:4, 9:16 with custom resolution support
- **Per-object properties** — label, type, z-index, description, colour palette (main / secondary / tertiary), and custom key-value props
- **Global colour palette** — define a top-level palette for the whole composition
- **LM Studio rephrase** — one-click AI rewrite of any description field via your local LM Studio instance
- **Live JSON panel** — the full Ideogram JSON updates in real-time as you build
- **Save / Open** — native file dialogs to save and reload `.json` prompt files
- **Persistent state** — your work survives app restarts (localStorage)

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- [Rust](https://rustup.rs) (for the Tauri backend)
- [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS

### Install & run

```bash
git clone https://github.com/Fablestarexpanse/idiotbuilder.git
cd idiotbuilder
npm install
npm run tauri dev
```

### Build a release binary

```bash
npm run tauri build
```

The installer is output to `src-tauri/target/release/bundle/`.

---

## LM Studio (optional)

Idiotbuilder can rephrase descriptions using a locally running [LM Studio](https://lmstudio.ai) server.

1. Start LM Studio and load any model
2. Enable the local server (default port 1234)
3. In the app click **⚙ Settings** → enter your base URL and model name

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Desktop shell | [Tauri 2](https://tauri.app) |
| UI framework | React 18 + TypeScript |
| Build tool | Vite |
| State | Zustand (with localStorage persistence) |
| Colour picker | @uiw/react-color |
| HTTP (LM Studio) | reqwest (Rust) |

---

## License

MIT
