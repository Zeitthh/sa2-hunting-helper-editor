import { useEffect, useCallback, useState } from 'react';
import { useEditor, useEditorState } from './store/editorStore';
import { Topbar } from './components/layout/Topbar';
import { Sidebar } from './components/layout/Sidebar';
import { MainArea } from './components/layout/MainArea';
import type { LevelKey } from './types/editor';

// ─── PushState routing ────────────────────────────────────────────────────────

export const LEVEL_TO_PATH: Record<LevelKey, string> = {
  PumpkinHill:   '/php',
  PumpkinHillNG: '/ph',
  AquaticMine:   '/am',
  DeathChamber:  '/dc',
  MeteorHerd:    '/mh',
  DryLagoon:     '/dl',
  EggQuarters:   '/eqp',
  EggQuartersNG: '/eqng',
  SecurityHall:  '/sh',
  MadSpace:      '/ms',
};

export const PATH_TO_LEVEL: Record<string, LevelKey> = Object.fromEntries(
  Object.entries(LEVEL_TO_PATH).map(([k, v]) => [v, k as LevelKey])
);

// GitHub Pages 404 hack
function decodePagesRedirect() {
  const params = new URLSearchParams(window.location.search);
  const redirectPath = params.get('p');
  if (redirectPath) {
    const cleanUrl = window.location.pathname + decodeURIComponent(redirectPath);
    window.history.replaceState(null, '', cleanUrl);
  }
}

// ─── App ──────────────────────────────────────────────────────────────────────

export function App() {
  const { isDarkMode, currentLevel } = useEditorState();
  const { dispatch } = useEditor();
  // 'home' = no level selected (landing screen)
  const [viewMode, setViewMode] = useState<'home' | 'level'>('home');

  // Dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark-theme',  isDarkMode);
    document.documentElement.classList.toggle('light-theme', !isDarkMode);
  }, [isDarkMode]);

  // Decode GitHub Pages 404 redirect on first load
  useEffect(() => { decodePagesRedirect(); }, []);

  // Level → URL
  useEffect(() => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    if (viewMode === 'home') {
      const homePath = base + '/';
      if (window.location.pathname !== homePath) {
        window.history.pushState(null, '', base + '/');
      }
      return;
    }
    const path = LEVEL_TO_PATH[currentLevel];
    const fullPath = base + path;
    if (window.location.pathname !== fullPath) {
      window.history.pushState(null, '', fullPath);
    }
  }, [currentLevel, viewMode]);

  // URL → state
  const syncFromPath = useCallback(() => {
    const base  = import.meta.env.BASE_URL.replace(/\/$/, '');
    const path  = window.location.pathname.replace(base, '') || '/';
    const level = PATH_TO_LEVEL[path];
    if (level) {
      dispatch({ type: 'SET_LEVEL', level });
      setViewMode('level');
    } else {
      setViewMode('home');
    }
  }, [dispatch]);

  useEffect(() => {
    syncFromPath();
    window.addEventListener('popstate', syncFromPath);
    return () => window.removeEventListener('popstate', syncFromPath);
  }, [syncFromPath]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const ctrl   = e.ctrlKey || e.metaKey;
      const tag    = (e.target as HTMLElement).tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if (ctrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
        return;
      }
      if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        dispatch({ type: 'REDO' });
        return;
      }
      if (inInput) return;
      if (ctrl && e.key === 'n') {
        e.preventDefault();
        if (viewMode === 'level') window.dispatchEvent(new CustomEvent('app:new-set'));
        return;
      }
      if (ctrl && e.key === 'e') {
        e.preventDefault();
        if (viewMode === 'level') window.dispatchEvent(new CustomEvent('topbar:export'));
        return;
      }
      if (ctrl && e.key === 'Delete') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('topbar:delete-active'));
        return;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch, viewMode]);

  return (
    <div className="app-layout">
      <Topbar viewMode={viewMode} onGoHome={() => setViewMode('home')} />
      <div className={`app-body${viewMode === 'home' ? ' app-body--home' : ''}`}>
        <Sidebar viewMode={viewMode} setViewMode={setViewMode} />
        <MainArea viewMode={viewMode} onSelectLevel={() => setViewMode('level')} />
      </div>
    </div>
  );
}
