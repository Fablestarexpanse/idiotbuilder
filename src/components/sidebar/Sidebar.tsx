import logo from "../../assets/logo.png";
import { version } from "../../../package.json";
import { ResolutionControl } from "./ResolutionControl";
import { AspectRatioPresets } from "./AspectRatioPresets";
import { MediumInput } from "./MediumInput";
import { GlobalColorPalette } from "./GlobalColorPalette";
import { BackgroundInput } from "./BackgroundInput";
import { ObjectList } from "./ObjectList";
import "./Sidebar.css";

interface Props {
  onOpenSettings: () => void;
  onOpenExport: () => void;
}

export function Sidebar({ onOpenSettings, onOpenExport }: Props) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <img src={logo} alt="Idiotbuilder" className="sidebar-logo" />
        <div className="sidebar-version">v{version}</div>
      </div>

      <div className="sidebar-body">
        <ResolutionControl />
        <AspectRatioPresets />
        <div className="sidebar-divider" />
        <MediumInput />
        <GlobalColorPalette />
        <div className="sidebar-divider" />
        <div className="sidebar-section-header">Compositional Deconstruction</div>
        <BackgroundInput />
        <ObjectList />
      </div>

      <div className="sidebar-footer">
        <button className="footer-btn" title="Export JSON" onClick={onOpenExport}>↗ Export JSON</button>
        <button className="footer-btn" title="Settings" onClick={onOpenSettings}>⚙ Settings</button>
      </div>
    </div>
  );
}
