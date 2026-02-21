import { useEffect, useRef, useState } from 'react';
import { useEditor } from '../../store/editorStore';
import { exportToTypeScript } from '../../utils/tsExporter';
import { importFromTypeScriptFile } from '../../utils/tsImporter';
import { useModal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { useSaved } from '../ui/SavedIndicator';

interface TopbarProps {
  viewMode: 'home' | 'level';
  onGoHome: () => void;
}

// ─── Shortcuts help modal ──────────────────────────────────────────────────────
function ShortcutsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box shortcuts-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-icon modal-icon--info">⌨</span>
          <h3 className="modal-title">Atajos de teclado</h3>
        </div>
        <div className="shortcuts-modal-grid">
          <kbd>Ctrl+Z</kbd>       <span>Deshacer</span>
          <kbd>Ctrl+Y</kbd>       <span>Rehacer</span>
          <kbd>Ctrl+Shift+Z</kbd> <span>Rehacer (alternativo)</span>
          <kbd>Ctrl+N</kbd>       <span>Nuevo set</span>
          <kbd>Ctrl+E</kbd>       <span>Exportar</span>
          <kbd>Ctrl+Delete</kbd>  <span>Eliminar set activo</span>
          <kbd>Escape</kbd>       <span>Cerrar ventanas / dropdowns</span>
        </div>
        <div className="modal-actions">
          <button className="modal-btn modal-btn--cancel" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

export function Topbar({ viewMode, onGoHome }: TopbarProps) {
  const { dispatch, state, currentSets, canUndo, canRedo, activeSet } = useEditor();
  const { isDarkMode, language } = state;
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const optionsRef     = useRef<HTMLDivElement>(null);
  const [optionsOpen,   setOptionsOpen]   = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { confirm } = useModal();
  const { toast }   = useToast();
  const { showSaved } = useSaved();

  const isHome = viewMode === 'home';

  useEffect(() => {
    if (!optionsOpen) return;
    function onOutside(e: MouseEvent) {
      if (optionsRef.current && !optionsRef.current.contains(e.target as Node)) setOptionsOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [optionsOpen]);

  async function doExport() {
    if (isHome) return;
    const defaultSets = currentSets.filter(s => s.column === 'default' && s.p1Name.trim());
    if (defaultSets.length > 0) {
      const names = defaultSets.map(s => `• ${s.p1Name}`).join('\n');
      if (!await confirm({ title: 'Sets sin posición', message: `${defaultSets.length} set(s) en "Default":\n\n${names}\n\n¿Exportar de todas formas?`, variant: 'warning', confirmLabel: 'Exportar' })) return;
    }
    const emptySets = currentSets.filter(s => s.p1Name.trim() && s.pieces.some(r => !r.p2.text.trim()));
    if (emptySets.length > 0) {
      const names = emptySets.map(s => `• ${s.p1Name}`).join('\n');
      if (!await confirm({ title: 'P2 vacíos', message: `${emptySets.length} set(s) con P2 sin rellenar:\n\n${names}\n\n¿Exportar?`, variant: 'warning', confirmLabel: 'Exportar' })) return;
    }
    const unnamedSets = currentSets.filter(s => !s.p1Name.trim());
    if (unnamedSets.length > 0) {
      if (!await confirm({ title: 'Sets sin nombre', message: `${unnamedSets.length} set(s) sin P1 serán omitidos.\n¿Continuar?`, variant: 'warning', confirmLabel: 'Continuar' })) return;
    }
    const ts = exportToTypeScript(currentSets);
    const blob = new Blob([ts], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${state.currentLevel}.ts`; a.click();
    URL.revokeObjectURL(url);
    toast(`Exportado como ${state.currentLevel}.ts`, 'success');
    showSaved();
  }

  useEffect(() => {
    const onExport = () => doExport();
    const onDeleteActive = async () => {
      if (!activeSet) return;
      const label = activeSet.p1Name || '(sin nombre)';
      const ok = await confirm({ title: 'Eliminar set', message: `¿Eliminar "${label}"?`, variant: 'danger', confirmLabel: 'Eliminar' });
      if (ok) { dispatch({ type: 'DELETE_SET', id: activeSet.id }); showSaved(); }
    };
    window.addEventListener('topbar:export', onExport);
    window.addEventListener('topbar:delete-active', onDeleteActive);
    return () => {
      window.removeEventListener('topbar:export', onExport);
      window.removeEventListener('topbar:delete-active', onDeleteActive);
    };
  }, [currentSets, activeSet, dispatch]);

  async function handleImportChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importFromTypeScriptFile(file);
      dispatch({ type: 'IMPORT_SETS', sets: imported });
      toast(`Importados ${imported.length} sets desde ${file.name}`, 'success');
      showSaved();
    } catch (err) {
      toast('Error al importar: ' + (err as Error).message, 'error');
    }
    e.target.value = '';
  }

  async function handleClearStorage() {
    const ok = await confirm({
      title: 'Borrar todos los datos',
      message: 'Esto borrará TODOS los sets de TODOS los niveles y configuraciones.\nEsta acción es irreversible.',
      variant: 'danger',
      confirmLabel: 'Borrar todo'
    });
    if (!ok) return;
    dispatch({ type: 'CLEAR_STORAGE' });
    toast('Datos borrados', 'info');
    setOptionsOpen(false);
    // Use setTimeout to let React flush the state update before navigating
    setTimeout(() => onGoHome(), 0);
  }

  async function handleClearLevelSettings() {
    const ok = await confirm({
      title: 'Borrar configuraciones de niveles',
      message: 'Esto borrará las configuraciones personalizadas de todos los niveles (piezas ocultas añadidas por ti).\nLos valores predeterminados (reset pieces) no se ven afectados.',
      variant: 'warning',
      confirmLabel: 'Borrar'
    });
    if (!ok) return;
    dispatch({ type: 'CLEAR_ALL_LEVEL_SETTINGS' });
    toast('Configuraciones de niveles borradas', 'info');
    setOptionsOpen(false);
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-brand" style={{ cursor: 'pointer' }} onClick={onGoHome} title="Ir a inicio">
          <img src={`${import.meta.env.BASE_URL}icons/HuntingHelperEditorLogo.svg`}
 alt="Logo" className="topbar-logo" width={28} height={28}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <h1>SA2 Hunting Editor</h1>
        </div>

        <div className="topbar-controls">
          <button className="topbar-btn" onClick={() => { dispatch({ type: 'UNDO' }); showSaved(); }} disabled={!canUndo} title="Deshacer (Ctrl+Z)">↩</button>
          <button className="topbar-btn" onClick={() => { dispatch({ type: 'REDO' }); showSaved(); }} disabled={!canRedo} title="Rehacer (Ctrl+Y)">↪</button>
          <div className="topbar-divider" />
          <button className="topbar-btn" onClick={doExport} disabled={isHome} title={isHome ? 'Selecciona un nivel primero' : 'Exportar (Ctrl+E)'}>Exportar</button>
          <button className="topbar-btn" onClick={() => fileInputRef.current?.click()} disabled={isHome} title={isHome ? 'Selecciona un nivel primero' : 'Importar'}>Importar</button>
          <input ref={fileInputRef} type="file" accept=".ts" style={{ display: 'none' }} onChange={handleImportChange} />
          <div className="topbar-divider" />

          {/* Options dropdown */}
          <div className="topbar-dropdown" ref={optionsRef}>
            <button className="topbar-btn" onClick={() => setOptionsOpen(o => !o)} aria-haspopup="true" aria-expanded={optionsOpen}>
              ⚙ Opciones
            </button>
            {optionsOpen && (
              <div className="dropdown-menu" role="menu">
                <div className="dropdown-item dropdown-item--toggle">
                  <span className="dropdown-item-label">Idioma</span>
                  <div className="lang-switch">
                    <button className={`lang-btn${language === 'spa' ? ' lang-btn--active' : ''}`} onClick={() => dispatch({ type: 'SET_LANGUAGE', lang: 'spa' })}>SPA</button>
                    <button className={`lang-btn${language === 'eng' ? ' lang-btn--active' : ''}`} onClick={() => dispatch({ type: 'SET_LANGUAGE', lang: 'eng' })}>ENG</button>
                  </div>
                </div>
                <div className="dropdown-divider" />
                <button className="dropdown-item" onClick={() => { setShowShortcuts(true); setOptionsOpen(false); }}>
                  ⌨ Ver atajos de teclado
                </button>
                <div className="dropdown-divider" />
                <button className="dropdown-item dropdown-item--danger" onClick={handleClearLevelSettings}>
                  Borrar config. de niveles
                </button>
                <button className="dropdown-item dropdown-item--danger" onClick={handleClearStorage}>
                  🗑 Borrar todos los datos
                </button>
              </div>
            )}
          </div>

          <a href="#" className="topbar-site-link" title="SA2 Hunting Helper" target="_blank" rel="noopener noreferrer">
            <img src={`${import.meta.env.BASE_URL}icons/HuntingHelper.svg`}
 alt="SA2 Hunting Helper" width={24} height={24}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </a>

          <button className="dark-mode-btn" onClick={() => dispatch({ type: 'TOGGLE_DARK_MODE' })} title={isDarkMode ? 'Modo claro' : 'Modo oscuro'} aria-label="Toggle dark mode">
            {isDarkMode
              ? <img src={`${import.meta.env.BASE_URL}icons/sun.svg`}
  alt="Modo claro"  width={20} height={20} />
              : <img src={`${import.meta.env.BASE_URL}icons/moon.svg`}
 alt="Modo oscuro" width={20} height={20} />}
          </button>
        </div>
      </header>
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
    </>
  );
}
