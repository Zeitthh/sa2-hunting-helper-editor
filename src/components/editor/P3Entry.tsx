import { useEditor } from '../../store/editorStore';
import { getP3List } from '../../data/levelData';
import { levelHasPredefinedP2P3 } from '../../data/levels';

interface P3EntryProps {
  setId: number;
  ri: number;
  pi: number;
  text: string;
  canDelete: boolean;
}

export function P3Entry({ setId, ri, pi, text, canDelete }: P3EntryProps) {
  const { dispatch, state } = useEditor();
  const { currentLevel } = state;
  const hasPredefined = levelHasPredefinedP2P3(currentLevel);
  const p3List = getP3List(currentLevel);
  const showDropdown = hasPredefined && p3List.length > 0;

  return (
    <div className="piece-input-row">
      <span className="p3-drag-handle" aria-hidden>≡</span>
      {showDropdown ? (
        <select
          value={text}
          onChange={e => dispatch({ type: 'SET_P3_TEXT', id: setId, ri, pi, value: e.target.value })}
        >
          <option value="">-- P3 --</option>
          {p3List.map(item => (
            <option key={item.p3} value={item.p3}>{item.p3}</option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          placeholder="Pieza 3"
          value={text}
          onChange={e => dispatch({ type: 'SET_P3_TEXT', id: setId, ri, pi, value: e.target.value })}
        />
      )}
      <button
        className="btn-danger btn-sm"
        onClick={() => dispatch({ type: 'DELETE_P3', id: setId, ri, pi })}
        disabled={!canDelete}
      >
        −
      </button>
    </div>
  );
}
