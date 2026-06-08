import { usePromptStore } from "../../store/usePromptStore";
import { ObjectCard } from "./ObjectCard/ObjectCard";
import "./ObjectList.css";

export function ObjectList() {
  const objects = usePromptStore((s) => s.objects);
  const addObject = usePromptStore((s) => s.addObject);

  return (
    <div className="object-list">
      {objects.map((obj, index) => (
        <ObjectCard key={obj.id} objectId={obj.id} index={index} />
      ))}
      <button className="add-object-btn" onClick={addObject}>
        + Add Object
      </button>
    </div>
  );
}
