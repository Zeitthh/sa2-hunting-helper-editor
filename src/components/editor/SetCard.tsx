import { useRef } from 'react';
import { useEditor } from '../../store/editorStore';
import { levelUsesPredefinedP1, levelHasPHGroups, getP1Group, PH_GROUP_LABELS } from '../../data/levels';
import { getP1List } from '../../data/levelData';
import { PieceRow } from './PieceRow';
import { useModal } from '../ui/Modal';
import { Select } from '../ui/Select';
import type { SelectItem, SelectGroup } from '../ui/Select';
import type { EditorSet } from '../../types/editor';

const DEFAULT_HIDDEN_BY_LEVEL: Partial<Record<string, string[]>> = {
  PumpkinHill:   ['La calavera indica el lugar.'],
  PumpkinHillNG: ['La calavera indica el lugar.'],
};

interface SetCardProps {
  set: EditorSet;
  usedP1s: Set<string>;
}

export function isSetIncomplete(set: EditorSet): boolean {
  return set.pieces.some(row => !row.p2.text.trim());
}

export function SetCard({ set, usedP1s }: SetCardProps) {
  const { dispatch, state, newlyAddedIds } = useEditor();
  const { currentLevel, levelSettings } = state;
  const { confirm } = useModal();

  const hasPredefinedP1 = levelUsesPredefinedP1(currentLevel);
  const hasPHGroups     = levelHasPHGroups(currentLevel);
  const p1List          = getP1List(currentLevel);
  const showDropdown    = hasPredefinedP1 && p1List.length > 0;
  const dragRowRef      = useRef<number | null>(null);

  const borderStyle = set.borderColor === 'none' ? 'var(--border-card)' : set.borderColor;
  const isNew       = newlyAddedIds.has(set.id);
  const incomplete  = !isNew && isSetIncomplete(set);

  // Merge default hidden + user hidden
  const defaultHidden = new Set(DEFAULT_HIDDEN_BY_LEVEL[currentLevel] ?? []);
  const userHidden    = new Set(levelSettings[currentLevel]?.hiddenP1s ?? []);
  const hiddenP1s     = new Set([...defaultHidden, ...userHidden]);

  // Build select items: grouped for PH levels, flat otherwise
  let p1SelectItems: SelectItem[] = [];
  if (showDropdown) {
    const placeholder: SelectItem = { value: '', label: '— Selecciona P1 —', disabled: true };

    if (hasPHGroups) {
      // Group by Church / Ghost Train / Pumpkin
      const groups: Record<string, SelectGroup> = {
        church:      { label: PH_GROUP_LABELS.church,      options: [] },
        ghost_train: { label: PH_GROUP_LABELS.ghost_train, options: [] },
        pumpkin:     { label: PH_GROUP_LABELS.pumpkin,     options: [] },
      };

      p1List.forEach(item => {
        if (hiddenP1s.has(item.p1) && item.p1 !== set.p1Name) return;
        const grp = getP1Group(item.color);
        groups[grp].options.push({
          value:    item.p1,
          label:    item.p1,
          color:    item.color,
          disabled: usedP1s.has(item.p1) && item.p1 !== set.p1Name,
        });
      });

      p1SelectItems = [
        placeholder,
        ...Object.values(groups).filter(g => g.options.length > 0),
      ];
    } else {
      // Flat list
      p1SelectItems = [
        placeholder,
        ...p1List
          .filter(item => !hiddenP1s.has(item.p1) || item.p1 === set.p1Name)
          .map(item => ({
            value:    item.p1,
            label:    item.p1,
            color:    item.color,
            disabled: usedP1s.has(item.p1) && item.p1 !== set.p1Name,
          })),
      ];
    }
  }

  async function handleDelete() {
    const label = set.p1Name || '(sin nombre)';
    const ok = await confirm({ title: 'Eliminar set', message: `¿Eliminar "${label}"?`, variant: 'danger', confirmLabel: 'Eliminar' });
    if (ok) dispatch({ type: 'DELETE_SET', id: set.id });
  }

  function handleRowDragStart(ri: number) { dragRowRef.current = ri; }
  function handleRowDrop(toRi: number) {
    const fromRi = dragRowRef.current;
    if (fromRi === null || fromRi === toRi) return;
    dispatch({ type: 'REORDER_ROWS', id: set.id, fromRi, toRi });
    dragRowRef.current = null;
  }

  return (
    <div
      className={`set-card${incomplete ? ' set-card--incomplete' : ''}`}
      id={`card-${set.id}`}
      style={{ borderColor: borderStyle }}
    >
      <div className="set-header">
        {showDropdown ? (
          <Select
            value={set.p1Name}
            onChange={v => dispatch({ type: 'SET_P1_NAME', id: set.id, value: v })}
            items={p1SelectItems}
            placeholder="— Selecciona P1 —"
            className="p1-selector-custom"
          />
        ) : (
          <input
            type="text"
            className="p1-selector"
            placeholder="Nombre del Set (P1)"
            value={set.p1Name}
            onChange={e => dispatch({ type: 'SET_P1_NAME', id: set.id, value: e.target.value })}
          />
        )}
        <button className="btn-danger btn-sm" onClick={handleDelete} title="Eliminar set">✕</button>
      </div>

      {incomplete && <div className="set-incomplete-banner">⚠ Hay filas con P2 vacío</div>}

      {set.pieces.map((row, ri) => {
        const usedP2s = new Set(set.pieces.filter((_, i) => i !== ri).map(r => r.p2.text).filter(Boolean));
        return (
          <div
            key={ri}
            draggable
            onDragStart={() => handleRowDragStart(ri)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => handleRowDrop(ri)}
            className="piece-row-drag-wrapper"
          >
            <PieceRow setId={set.id} ri={ri} row={row} canDelete={set.pieces.length > 1} usedP2s={usedP2s} />
          </div>
        );
      })}

      <div className="set-footer-actions">
        <button className="btn-primary btn-sm" onClick={() => dispatch({ type: 'ADD_ROW', id: set.id })}>
          + P2/P3
        </button>
      </div>
    </div>
  );
}

