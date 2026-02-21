import { useEditor } from '../../store/editorStore';

interface TagPillsProps {
  setId: number;
  ri: number;
  field: 'p2' | 'p3';
  pi: number;
  currentTags: string[];
  availableTags: string[];
}

export function TagPills({ setId, ri, field, pi, currentTags, availableTags }: TagPillsProps) {
  const { dispatch } = useEditor();

  if (availableTags.length === 0) return null;

  return (
    <div className="tags-row">
      {availableTags.map(tag => {
        const isActive = currentTags.includes(tag);
        return (
          <label
            key={tag}
            className={`tag-pill ${isActive ? 'active' : ''}`}
          >
            <input
              type="checkbox"
              checked={isActive}
              onChange={() =>
                dispatch({ type: 'TOGGLE_TAG', id: setId, ri, field, pi, tag })
              }
            />
            {tag}
          </label>
        );
      })}
    </div>
  );
}
