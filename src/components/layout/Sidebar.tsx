import { useRef, useState, useEffect } from 'react';
import { useEditor } from '../../store/editorStore';
import { LEVELS, LEVEL_GROUPS, LEVEL_ACCENT, levelUsesPredefinedP1 } from '../../data/levels';
import { getP1List } from '../../data/levelData';
import { isSetIncomplete } from '../editor/SetCard';
import { useModal } from '../ui/Modal';
import { useSaved } from '../ui/SavedIndicator';
import { Select } from '../ui/Select';
import { Tooltip } from '../ui/Tooltip';
import { LevelSettingsPanel } from './LevelSettingsPanel';
import type { SelectItem } from '../ui/Select';
import type { EditorSet, LevelKey } from '../../types/editor';

const COLUMN_ORDER: Array<EditorSet['column']> = ['default', 'left', 'center', 'right'];
const COLUMN_LABELS: Record<EditorSet['column'], string> = {
  default: 'Default',
  left:    'Izquierda',
  center:  'Centro',
  right:   'Derecha',
};

interface SidebarProps {
  viewMode: 'home' | 'level';
  setViewMode: (v: 'home' | 'level') => void;
}

export function Sidebar({ viewMode, setViewMode }: SidebarProps) {
  const { dispatch, state, currentSets, activeSet } = useEditor();
  const { currentLevel, levelSettings } = state;
  const dragSetId    = useRef<number | null>(null);
  const dragSetIndex = useRef<number | null>(null);
  const { confirm } = useModal();
  const { showSaved } = useSaved();

  const [collapsed, setCollapsed] = useState<Set<EditorSet['column']>>(new Set());
  const [showLevelSettings, setShowLevelSettings] = useState(false);

  function toggleCollapse(col: EditorSet['column']) {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(col) ? next.delete(col) : next.add(col);
      return next;
    });
  }

  // Level select items with optgroups — no color dots (level accent is on nav items, not selector)
  const levelSelectItems: SelectItem[] = [
    { value: '', label: '— Inicio —' },
    ...LEVEL_GROUPS.map(group => ({
      label: group.separator,
      options: group.levels.map(l => ({ value: l.key, label: l.label })),
    })),
  ];

  // P1 info (respecting hidden settings)
  const p1List = levelUsesPredefinedP1(currentLevel) ? getP1List(currentLevel) : [];
  const hiddenP1s = new Set(levelSettings[currentLevel]?.hiddenP1s ?? []);
  const visibleP1List = p1List.filter(e => !hiddenP1s.has(e.p1));
  const usedP1Count  = p1List.length > 0 ? currentSets.filter(s => s.p1Name.trim()).length : null;
  const p1Exhausted  = visibleP1List.length > 0 && visibleP1List.every(e =>
    currentSets.some(s => s.p1Name === e.p1)
  );

  function handleAddSet() {
    dispatch({ type: 'ADD_SET' });
    showSaved();
  }

  useEffect(() => {
    function onNewSet() { if (viewMode === 'level' && !p1Exhausted) handleAddSet(); }
    window.addEventListener('app:new-set', onNewSet);
    return () => window.removeEventListener('app:new-set', onNewSet);
  }, [p1Exhausted, viewMode, currentLevel]);

  async function handleClearLevel() {
    const label = LEVELS.find(l => l.key === currentLevel)?.label ?? currentLevel;
    const ok = await confirm({
      title: 'Limpiar nivel',
      message: `¿Borrar todos los sets de ${label}?\n\nEsta acción NO se puede deshacer.`,
      variant: 'danger',
      confirmLabel: 'Borrar',
    });
    if (ok) { dispatch({ type: 'CLEAR_LEVEL' }); showSaved(); }
  }

  function handleLevelChange(value: string) {
    if (!value) { setViewMode('home'); return; }
    dispatch({ type: 'SET_LEVEL', level: value as LevelKey });
    setViewMode('level');
    showSaved();
  }

  const grouped = COLUMN_ORDER.reduce((acc, col) => {
    acc[col] = currentSets.filter(s => s.column === col);
    return acc;
  }, {} as Record<EditorSet['column'], EditorSet[]>);

  function handleSetDragStart(id: number, globalIndex: number) {
    dragSetId.current    = id;
    dragSetIndex.current = globalIndex;
  }
  function handleColumnDrop(col: EditorSet['column']) {
    if (dragSetId.current === null) return;
    dispatch({ type: 'MOVE_SET_TO_COLUMN', id: dragSetId.current, column: col });
    dragSetId.current = null;
    showSaved();
  }
  function handleSetDropOnItem(targetGlobalIndex: number) {
    if (dragSetIndex.current === null || dragSetIndex.current === targetGlobalIndex) return;
    dispatch({ type: 'REORDER_SETS', fromIndex: dragSetIndex.current, toIndex: targetGlobalIndex });
    dragSetIndex.current = null;
    showSaved();
  }

  const isHome = viewMode === 'home';

  return (
    <aside className="sidebar">
      {/* Level selector — Custom Select */}
      <div className="sidebar-section">
        <label className="sidebar-label">Nivel</label>
        <Select
          value={isHome ? '' : currentLevel}
          onChange={handleLevelChange}
          items={levelSelectItems}
          placeholder="— Inicio —"
          className="sidebar-level-select-custom"
          noCheck
        />
      </div>

      {!isHome && (
        <>
          {/* Add + Clear + Settings */}
          <div className="sidebar-section sidebar-actions">
            <Tooltip text="Nuevo Set (Ctrl+N)">
              <button
                className="btn-success sidebar-add-btn"
                onClick={handleAddSet}
                disabled={p1Exhausted}
              >
                + Nuevo Set
              </button>
            </Tooltip>
            {currentSets.length > 0 && (
              <Tooltip text="Borrar todos los sets de este nivel (irreversible)">
                <button className="btn-danger sidebar-clear-btn" onClick={handleClearLevel}>
                  Limpiar nivel
                </button>
              </Tooltip>
            )}
            <Tooltip text="Configuración de este nivel">
              <button
                className="btn-secondary sidebar-settings-btn"
                onClick={() => setShowLevelSettings(true)}
                aria-label="Configuración del nivel"
              >
                Configuración del nivel
              </button>
            </Tooltip>
          </div>

          {/* Sets header */}
          <div className="sidebar-section sidebar-sets-list">
            <div className="sidebar-sets-header">
              <label className="sidebar-label">
                {usedP1Count !== null
                  ? <span className={p1Exhausted ? 'text-complete' : ''}>
                      Sets ({usedP1Count}/{p1List.length})
                    </span>
                  : `Sets (${currentSets.length})`
                }
              </label>
            </div>

            {currentSets.length === 0 ? (
              <p className="sidebar-empty">Sin sets aún.</p>
            ) : (
              <div className="set-nav-groups">
                {COLUMN_ORDER.map(col => {
                  const group = grouped[col];
                  const isCollapsed = collapsed.has(col);
                  return (
                    <div
                      key={col}
                      className="set-nav-group"
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => handleColumnDrop(col)}
                    >
                      <button className="set-nav-group-label" onClick={() => toggleCollapse(col)}>
                        <span className="set-nav-group-name">
                          <span className="set-nav-group-chevron">{isCollapsed ? '▶' : '▼'}</span>
                          {COLUMN_LABELS[col]}
                        </span>
                        {group.length > 0 && (
                          <span className="set-nav-group-count">{group.length}</span>
                        )}
                      </button>

                      <div className={`set-nav-collapse${!isCollapsed ? ' set-nav-collapse--open' : ''}`}>
                        {group.length === 0 ? (
                          <div className="set-nav-drop-hint">Arrastra aquí</div>
                        ) : (
                          <ul className="set-nav">
                            {group.map(set => {
                              const globalIndex = currentSets.indexOf(set);
                              const color    = set.borderColor !== 'none' ? set.borderColor : 'var(--border-default)';
                              const label    = set.p1Name || '(sin nombre)';
                              const isActive = activeSet?.id === set.id;
                              const incomplete = isSetIncomplete(set);
                              return (
                                <li
                                  key={set.id}
                                  draggable
                                  onDragStart={() => handleSetDragStart(set.id, globalIndex)}
                                  onDragOver={e => e.preventDefault()}
                                  onDrop={() => handleSetDropOnItem(globalIndex)}
                                  className={[
                                    'set-nav-item',
                                    isActive   ? 'set-nav-item--active'     : '',
                                    incomplete ? 'set-nav-item--incomplete' : '',
                                  ].filter(Boolean).join(' ')}
                                  style={isActive ? { borderColor: LEVEL_ACCENT[currentLevel] } : undefined}
                                  onClick={() => dispatch({ type: 'SELECT_SET', id: set.id })}
                                >
                                  <span className="set-nav-drag-handle" aria-hidden>⠿</span>
                                  <span className="set-nav-dot" style={{ background: color }} />
                                  <span className="set-nav-label">{label}</span>
                                  {incomplete && <span className="set-nav-warn">⚠</span>}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {showLevelSettings && (
        <LevelSettingsPanel onClose={() => setShowLevelSettings(false)} />
      )}
    </aside>
  );
}
