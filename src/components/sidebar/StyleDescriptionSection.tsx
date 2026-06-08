import { usePromptStore } from "../../store/usePromptStore";

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
        <label>Aesthetics</label>
        <input
          type="text"
          value={aesthetics}
          placeholder="Overall visual style and treatment..."
          onChange={(e) => setAesthetics(e.target.value)}
        />
      </div>
      <div className="field">
        <label>Lighting</label>
        <input
          type="text"
          value={lighting}
          placeholder="Light source, direction, quality..."
          onChange={(e) => setLighting(e.target.value)}
        />
      </div>
      <div className="field">
        <label>Photo / Camera</label>
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
