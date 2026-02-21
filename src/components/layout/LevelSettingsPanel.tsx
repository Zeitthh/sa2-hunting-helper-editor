import { useState, useMemo } from 'react';
import { useEditor } from '../../store/editorStore';
import { getP1List } from '../../data/levelData';
import { levelUsesPredefinedP1, LEVELS, levelHasPHGroups, PH_GROUP_LABELS, getP1Group, type PH_Group } from '../../data/levels';
import type { LevelKey } from '../../types/editor';

// Suggested defaults (user can still uncheck these)
const DEFAULT_HIDDEN: Partial<Record<LevelKey, string[]>> = {
  PumpkinHill:   ['La calavera indica el lugar.'],
  PumpkinHillNG: ['La calavera indica el lugar.'],
};

interface LevelSettingsPanelProps {
  onClose: () => void;
}

export function LevelSettingsPanel({ onClose }: LevelSettingsPanelProps) {
  const { dispatch, state } = useEditor();
  const { currentLevel, levelSettings } = state;

  const defaults = DEFAULT_HIDDEN[currentLevel] ?? [];
  const saved    = levelSettings[currentLevel]?.hiddenP1s;

  // If user has saved settings, use those; otherwise start with defaults
  const initialHidden = saved !== undefined
    ? new Set(saved)
    : new Set(defaults);

  const [hiddenSet, setHiddenSet] = useState<Set<string>>(initialHidden);
  const [filter, setFilter] = useState('');
  const [activeGroup, setActiveGroup] = useState<PH_Group>('all');

  const p1List      = levelUsesPredefinedP1(currentLevel) ? getP1List(currentLevel) : [];
  const hasPHGroups = levelHasPHGroups(currentLevel);
  const levelLabel  = LEVELS.find(l => l.key === currentLevel)?.label ?? currentLevel;

  const filteredList = useMemo(() => {
    return p1List.filter(item => {
      const matchesFilter = !filter || item.p1.toLowerCase().includes(filter.toLowerCase());
      const matchesGroup  = !hasPHGroups || activeGroup === 'all' || getP1Group(item.color) === activeGroup;
      return matchesFilter && matchesGroup;
    });
  }, [p1List, filter, activeGroup, hasPHGroups]);

  function toggleP1(p1: string) {
    setHiddenSet(prev => {
      const next = new Set(prev);
      next.has(p1) ? next.delete(p1) : next.add(p1);
      return next;
    });
  }

  function handleSave() {
    dispatch({
      type: 'SET_LEVEL_SETTINGS',
      level: currentLevel,
      settings: { hiddenP1s: [...hiddenSet] },
    });
    onClose();
  }

  function handleReset() {
    setHiddenSet(new Set(defaults));
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box level-settings-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-icon modal-icon--info">⚙</span>
          <h3 className="modal-title">Configuración — {levelLabel}</h3>
        </div>

        <div className="level-settings-body">
          <section className="ls-section">
            <div className="ls-section-header">
              <h4>Ocultar Reset Pieces</h4>
              <span className="ls-badge ls-badge--always-on">Siempre activo</span>
            </div>
            <p className="ls-desc">
              Las piezas marcadas no aparecerán en el selector de P1. Las marcadas con <strong>reset</strong> son sugerencias predeterminadas.
            </p>

            {p1List.length > 0 ? (
              <>
                {/* Group tabs for PH levels */}
                {hasPHGroups && (
                  <div className="ls-group-tabs">
                    {(Object.entries(PH_GROUP_LABELS) as [PH_Group, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        className={`ls-group-tab${activeGroup === key ? ' ls-group-tab--active' : ''}`}
                        onClick={() => setActiveGroup(key)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Filter row */}
                <div className="ls-filter-row">
                  <input
                    type="text"
                    className="ls-filter-input"
                    placeholder="Filtrar P1..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                  />
                  {filter && (
                    <button className="btn-sm" onClick={() => setFilter('')}>
                      ✕ Limpiar
                    </button>
                  )}
                </div>

                {/* P1 list */}
                <div className="ls-p1-list">
                  {filteredList.length === 0 && (
                    <p className="ls-no-list">Sin resultados para "{filter}"</p>
                  )}
                  {filteredList.map(item => {
                    const isHidden  = hiddenSet.has(item.p1);
                    const isDefault = defaults.includes(item.p1);
                    return (
                      <label
                        key={item.p1}
                        className={`ls-p1-item${isHidden ? ' ls-p1-item--hidden' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isHidden}
                          onChange={() => toggleP1(item.p1)}
                        />
                        <span className="ls-p1-dot" style={{ background: item.color }} />
                        <span className="ls-p1-name">{item.p1}</span>
                        {isDefault && <span className="ls-default-tag">reset</span>}
                      </label>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="ls-no-list">Este nivel no tiene lista predefinida de P1.</p>
            )}
          </section>
        </div>

        <div className="modal-actions">
          <button className="modal-btn modal-btn--cancel" onClick={handleReset} title="Restaurar valores predeterminados">
            Restablecer
          </button>
          <button className="modal-btn modal-btn--cancel" onClick={onClose}>Cancelar</button>
          <button className="modal-btn modal-btn--confirm modal-btn--info" onClick={handleSave}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
