import { useState } from "react";
import { Sidebar } from "./components/sidebar/Sidebar";
import { CanvasPanel } from "./components/canvas/CanvasPanel";
import { JsonPanel } from "./components/shared/JsonPanel";
import { SettingsModal } from "./components/shared/SettingsModal";
import { JsonExport } from "./components/shared/JsonExport";
import "./App.css";

export default function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport] = useState(false);

  return (
    <div className="app">
      <Sidebar onOpenSettings={() => setShowSettings(true)} onOpenExport={() => setShowExport(true)} />
      <CanvasPanel />
      <JsonPanel />
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showExport && <JsonExport onClose={() => setShowExport(false)} />}
    </div>
  );
}
