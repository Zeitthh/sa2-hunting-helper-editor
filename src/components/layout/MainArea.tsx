import { useEditor } from '../../store/editorStore';
import { SetCard } from '../editor/SetCard';
import { HomeScreen } from './HomeScreen';

interface MainAreaProps {
  viewMode: 'home' | 'level';
  onSelectLevel?: () => void;
}

export function MainArea({ viewMode, onSelectLevel }: MainAreaProps) {
  const { activeSet, currentSets, getUsedP1s } = useEditor();
  const usedP1s = getUsedP1s();

  if (viewMode === 'home') {
    return <HomeScreen onSelectLevel={onSelectLevel ?? (() => {})} />;
  }

  return (
    <main className="main-area">
      {currentSets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>Sin sets en este nivel</h3>
          <p>Crea tu primer set con el botón <strong>+ Nuevo Set</strong> en el panel izquierdo.</p>
          <p className="empty-hint">También puedes usar <kbd>Ctrl+N</kbd></p>
        </div>
      ) : activeSet === null ? (
        <div className="empty-state">
          <div className="empty-state-icon">👈</div>
          <h3>Selecciona un set</h3>
          <p>Haz clic en cualquier set del panel izquierdo para editarlo.</p>
        </div>
      ) : (
        <SetCard key={activeSet.id} set={activeSet} usedP1s={usedP1s} />
      )}
    </main>
  );
}
