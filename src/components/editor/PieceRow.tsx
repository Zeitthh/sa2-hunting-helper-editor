import { useRef } from 'react';
import { useEditor } from '../../store/editorStore';
import { getTagsForLevel } from '../../data/tags';
import { getP2List } from '../../data/levelData';
import { levelHasPredefinedP2P3 } from '../../data/levels';
import { TagPills } from './TagPills';
import { P3Entry } from './P3Entry';
import type { PieceRow as PieceRowType } from '../../types/editor';

interface PieceRowProps {
  setId: number;
  ri: number;
  row: PieceRowType;
  canDelete: boolean;
  usedP2s: Set<string>;
}

export function PieceRow({ setId, ri, row, canDelete, usedP2s }: PieceRowProps) {
  const { dispatch, state } = useEditor();
  const { currentLevel } = state;
  const hasPredefined = levelHasPredefinedP2P3(currentLevel);
  const p2List = getP2List(currentLevel);
  const tags = getTagsForLevel(currentLevel);
  const showDropdown = hasPredefined && p2List.length > 0;

  const dragP3Ref = useRef<number | null>(null);

  function handleP3DragStart(pi: number) { dragP3Ref.current = pi; }
  function handleP3Drop(toPi: number) {
    const fromPi = dragP3Ref.current;
    if (fromPi === null || fromPi === toPi) return;
    dispatch({ type: 'REORDER_P3S', id: setId, ri, fromPi, toPi });
    dragP3Ref.current = null;
  }

  return (
    <div className="piece-row">
      {/* Drag handle */}
      <div className="piece-row-drag-handle" title="Arrastrar fila">≡</div>

      {/* P2 column */}
      <div className="piece-col">
        <span className="col-label">P2</span>
        {showDropdown ? (
          <select
            value={row.p2.text}
            onChange={e => dispatch({ type: 'SET_P2_TEXT', id: setId, ri, value: e.target.value })}
          >
            <option value="">-- P2 --</option>
            {p2List.map(item => {
              const isUsed = usedP2s.has(item.p2) && item.p2 !== row.p2.text;
              return (
                <option key={item.p2} value={item.p2} disabled={isUsed}>
                  {item.p2}
                </option>
              );
            })}
          </select>
        ) : (
          <input
            type="text"
            placeholder="Pieza 2"
            value={row.p2.text}
            onChange={e => dispatch({ type: 'SET_P2_TEXT', id: setId, ri, value: e.target.value })}
          />
        )}
        {tags.length > 0 && (
          <TagPills setId={setId} ri={ri} field="p2" pi={0} currentTags={row.p2.tags} availableTags={tags} />
        )}
      </div>

      {/* P3 column — with per-P3 drag */}
      <div className="piece-col">
        <span className="col-label">P3</span>
        <div className="p3-list">
          {row.p3s.map((p3, pi) => (
            <div
              key={pi}
              draggable
              onDragStart={() => handleP3DragStart(pi)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleP3Drop(pi)}
              className="p3-drag-wrapper"
            >
              <P3Entry setId={setId} ri={ri} pi={pi} text={p3.text} canDelete={row.p3s.length > 1} />
            </div>
          ))}
        </div>
        <button className="btn-success btn-sm" onClick={() => dispatch({ type: 'ADD_P3', id: setId, ri })}>
          + P3
        </button>
      </div>

      {/* Actions column */}
      <div className="row-actions">
        <button className="btn-danger btn-sm" onClick={() => dispatch({ type: 'DELETE_ROW', id: setId, ri })} disabled={!canDelete}>
          ✕
        </button>
      </div>
    </div>
  );
}
