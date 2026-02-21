import { useEditor } from '../../store/editorStore';
import type { Confirm } from '../../types/editor';

interface ConfirmRowProps {
  setId: number;
  ci: number;
  confirm: Confirm;
}

export function ConfirmRow({ setId, ci, confirm }: ConfirmRowProps) {
  const { dispatch, currentSets } = useEditor();

  // All P1s in this level that have a name — used for both dropdowns
  const p1Options = currentSets
    .map(s => s.p1Name)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'es'));

  return (
    <div className="confirm-row">
      <select
        value={confirm.confirmed}
        onChange={e =>
          dispatch({ type: 'SET_CONFIRM_FIELD', id: setId, ci, field: 'confirmed', value: e.target.value })
        }
      >
        <option value="">-- Confirmed --</option>
        {p1Options.map(p1 => (
          <option key={p1} value={p1}>{p1}</option>
        ))}
      </select>

      <select
        value={confirm.confirmedBy}
        onChange={e =>
          dispatch({ type: 'SET_CONFIRM_FIELD', id: setId, ci, field: 'confirmedBy', value: e.target.value })
        }
      >
        <option value="">-- Confirmed By --</option>
        {p1Options.map(p1 => (
          <option key={p1} value={p1}>{p1}</option>
        ))}
      </select>

      <button
        className="btn-danger btn-sm"
        onClick={() => dispatch({ type: 'DELETE_CONFIRM', id: setId, ci })}
      >
        −
      </button>
    </div>
  );
}
