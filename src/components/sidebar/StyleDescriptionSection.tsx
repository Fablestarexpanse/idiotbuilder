import { usePromptStore } from "../../store/usePromptStore";
import { RephraseButton } from "../shared/RephraseButton";

const AESTHETICS_PROMPT =
  "You are an AI image prompt writer. Describe the visual aesthetics and art style " +
  "of the scene. Be specific: name the art movement, rendering style, texture quality, " +
  "and overall visual treatment. Return 1 sentence only. No preamble, no labels.";

const LIGHTING_PROMPT =
  "You are an AI image prompt writer. Describe the lighting for this scene in " +
  "specific detail: light source type, direction, color temperature, quality " +
  "(hard/soft), and mood contribution. Return 1 sentence only. No preamble, no labels.";

const PHOTO_PROMPT =
  "You are an AI image prompt writer. Describe camera and lens characteristics " +
  "for this scene: camera type, lens focal length, aperture, depth of field, " +
  "and any film or sensor qualities. If the scene is not photographic, return " +
  "an empty string. Return a short phrase only. No preamble, no labels.";

export function StyleDescriptionSection() {
  const aesthetics = usePromptStore((s) => s.aesthetics);
  const lighting = usePromptStore((s) => s.lighting);
  const photo = usePromptStore((s) => s.photo);
  const setAesthetics = usePromptStore((s) => s.setAesthetics);
  const setLighting = usePromptStore((s) => s.setLighting);
  const setPhoto = usePromptStore((s) => s.setPhoto);

  return (
    <>
      <div className="field">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <label style={{ margin: 0 }}>Aesthetics</label>
          <RephraseButton text={aesthetics} onRephrase={setAesthetics} systemPrompt={AESTHETICS_PROMPT} />
        </div>
        <input
          type="text"
          value={aesthetics}
          placeholder="Overall visual style and treatment..."
          onChange={(e) => setAesthetics(e.target.value)}
        />
      </div>

      <div className="field">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <label style={{ margin: 0 }}>Lighting</label>
          <RephraseButton text={lighting} onRephrase={setLighting} systemPrompt={LIGHTING_PROMPT} />
        </div>
        <input
          type="text"
          value={lighting}
          placeholder="Light source, direction, quality..."
          onChange={(e) => setLighting(e.target.value)}
        />
      </div>

      <div className="field">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <label style={{ margin: 0 }}>Photo / Camera</label>
          <RephraseButton text={photo} onRephrase={setPhoto} systemPrompt={PHOTO_PROMPT} />
        </div>
        <input
          type="text"
          value={photo}
          placeholder="Camera or lens characteristics (leave blank if not photographic)..."
          onChange={(e) => setPhoto(e.target.value)}
        />
      </div>
    </>
  );
}
