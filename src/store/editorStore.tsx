import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useState,
  useEffect,
  type ReactNode,
} from 'react';

let _pendingNewSet = false;
import type { EditorSet, Piece, LevelKey } from '../types/editor';
import { LEVELS, levelUsesPredefinedP1, levelHasPredefinedP2P3 } from '../data/levels';
import { getColorForP1, getColorForP2, getColorForP3, getP1List } from '../data/levelData';

// ─────────────────────────────────────────────
// FACTORY HELPERS
// ─────────────────────────────────────────────

export function makePiece(): Piece {
  return { text: '', tags: [], color: '' };
}

export function makeRow() {
  return { p2: makePiece(), p3s: [makePiece()] };
}

let _idCounter = Date.now(); // start from timestamp to avoid collisions with restored state

export function makeSet(): EditorSet {
  return {
    id: _idCounter++,
    p1Name: '',
    borderColor: 'none',
    column: 'default',
    pieces: [makeRow()],
  };
}

// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// LEVEL SETTINGS
// ─────────────────────────────────────────────

export interface LevelSettings {
  hiddenP1s: string[];
}

export type LevelSettingsMap = Partial<Record<LevelKey, LevelSettings>>;

// ─────────────────────────────────────────────
// PER-LEVEL SET MAP HELPERS
// ─────────────────────────────────────────────

type LevelSets   = Record<LevelKey, EditorSet[]>;
type LevelActive = Record<LevelKey, number | null>;

function emptyLevelSets(): LevelSets {
  return Object.fromEntries(LEVELS.map(l => [l.key, []])) as LevelSets;
}

function emptyLevelActive(): LevelActive {
  return Object.fromEntries(LEVELS.map(l => [l.key, null])) as LevelActive;
}

// ─────────────────────────────────────────────
// LOCALSTORAGE
// ─────────────────────────────────────────────

const LS_KEY = 'zeithheditor_v1';

function saveToStorage(state: EditorState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({
      levelSets:    state.levelSets,
      levelActive:  state.levelActive,
      currentLevel: state.currentLevel,
      isDarkMode:   state.isDarkMode,
    }));
  } catch { /* quota exceeded – ignore */ }
}

function loadFromStorage(): Partial<EditorState> | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<EditorState>;
  } catch { return null; }
}

function mergeWithEmpty(saved: Partial<EditorState>): EditorState {
  const empty = {
    levelSets:     emptyLevelSets(),
    levelActive:   emptyLevelActive(),
    currentLevel:  'PumpkinHill' as LevelKey,
    isDarkMode:    false,
    language:      'spa' as const,
    levelSettings: {} as LevelSettingsMap,
  };
  // Merge level sets (saved may have subset of keys if levels changed)
  if (saved.levelSets) {
    for (const key of Object.keys(saved.levelSets) as LevelKey[]) {
      if (key in empty.levelSets) {
        empty.levelSets[key] = saved.levelSets[key] ?? [];
      }
    }
  }
  if (saved.levelActive) {
    for (const key of Object.keys(saved.levelActive) as LevelKey[]) {
      if (key in empty.levelActive) {
        empty.levelActive[key] = saved.levelActive[key] ?? null;
      }
    }
  }
  if (saved.currentLevel && saved.currentLevel in empty.levelSets) {
    empty.currentLevel = saved.currentLevel;
  }
  if (typeof saved.isDarkMode === 'boolean') {
    empty.isDarkMode = saved.isDarkMode;
  }
  if (saved.language === 'spa' || saved.language === 'eng') {
    empty.language = saved.language;
  }
  if (saved.levelSettings && typeof saved.levelSettings === 'object') {
    empty.levelSettings = saved.levelSettings;
  }
  return empty;
}

// ─────────────────────────────────────────────
// ACTION TYPES
// ─────────────────────────────────────────────

export type EditorAction =
  | { type: 'SET_LEVEL'; level: LevelKey }
  | { type: 'SELECT_SET'; id: number | null }
  | { type: 'ADD_SET' }
  | { type: 'DELETE_SET'; id: number }
  | { type: 'CLEAR_LEVEL' }
  | { type: 'CLEAR_STORAGE' }
  | { type: 'IMPORT_SETS'; sets: EditorSet[] }
  | { type: 'REORDER_SETS'; fromIndex: number; toIndex: number }
  | { type: 'SET_LANGUAGE'; lang: 'spa' | 'eng' }
  | { type: 'SET_LEVEL_SETTINGS'; level: LevelKey; settings: LevelSettings }
  | { type: 'CLEAR_ALL_LEVEL_SETTINGS' }
  | { type: 'SET_P1_NAME'; id: number; value: string }
  | { type: 'SET_BORDER_COLOR'; id: number; color: string }
  | { type: 'SET_COLUMN'; id: number; column: EditorSet['column'] }
  | { type: 'MOVE_SET_TO_COLUMN'; id: number; column: EditorSet['column'] }
  | { type: 'ADD_ROW'; id: number }
  | { type: 'DELETE_ROW'; id: number; ri: number }
  | { type: 'REORDER_ROWS'; id: number; fromRi: number; toRi: number }
  | { type: 'REORDER_P3S'; id: number; ri: number; fromPi: number; toPi: number }
  | { type: 'SET_P2_TEXT'; id: number; ri: number; value: string }
  | { type: 'ADD_P3'; id: number; ri: number }
  | { type: 'DELETE_P3'; id: number; ri: number; pi: number }
  | { type: 'SET_P3_TEXT'; id: number; ri: number; pi: number; value: string }
  | { type: 'TOGGLE_TAG'; id: number; ri: number; field: 'p2' | 'p3'; pi: number; tag: string }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'UNDO' }
  | { type: 'REDO' };

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────

export interface EditorState {
  levelSets:      LevelSets;
  levelActive:    LevelActive;
  currentLevel:   LevelKey;
  isDarkMode:     boolean;
  language:       'spa' | 'eng';
  levelSettings:  LevelSettingsMap;
}

// Undo/redo history stored outside reducer (mutable ref pattern)
let _past:   EditorState[] = [];
let _future: EditorState[] = [];
const MAX_HISTORY = 50;

// Actions that should NOT push to undo stack
const NO_HISTORY_ACTIONS = new Set<EditorAction['type']>([
  'SET_LEVEL', 'SELECT_SET', 'TOGGLE_DARK_MODE', 'UNDO', 'REDO', 'CLEAR_STORAGE', 'CLEAR_LEVEL',
  'SET_LANGUAGE', 'SET_LEVEL_SETTINGS', 'CLEAR_ALL_LEVEL_SETTINGS',
]);

const saved = loadFromStorage();
const initialState: EditorState = saved ? mergeWithEmpty(saved) : {
  levelSets:     emptyLevelSets(),
  levelActive:   emptyLevelActive(),
  currentLevel:  'PumpkinHill',
  isDarkMode:    false,
  language:      'spa',
  levelSettings: {},
};

// ─────────────────────────────────────────────
// PURE HELPERS
// ─────────────────────────────────────────────

function mapSets(
  state: EditorState,
  id: number,
  updater: (s: EditorSet) => EditorSet,
): LevelSets {
  const level = state.currentLevel;
  return {
    ...state.levelSets,
    [level]: state.levelSets[level].map(s => (s.id === id ? updater({ ...s }) : s)),
  };
}

// ─────────────────────────────────────────────
// REDUCER (pure)
// ─────────────────────────────────────────────

function pureReducer(state: EditorState, action: EditorAction): EditorState {
  const level = state.currentLevel;

  switch (action.type) {

    case 'SET_LEVEL':
      return { ...state, currentLevel: action.level };

    case 'SELECT_SET':
      return { ...state, levelActive: { ...state.levelActive, [level]: action.id } };

    case 'ADD_SET': {
      const newSet = makeSet();
      if (levelUsesPredefinedP1(level)) {
        const p1List = getP1List(level);
        const usedP1s = new Set(state.levelSets[level].map(s => s.p1Name));
        const firstFree = p1List.find(e => !usedP1s.has(e.p1));
        if (firstFree) {
          newSet.p1Name = firstFree.p1;
          const color = getColorForP1(level, firstFree.p1);
          if (color) newSet.borderColor = color;
        }
      }
      return {
        ...state,
        levelSets:   { ...state.levelSets,   [level]: [...state.levelSets[level], newSet] },
        levelActive: { ...state.levelActive,  [level]: newSet.id },
      };
    }

    case 'DELETE_SET': {
      const remaining = state.levelSets[level].filter(s => s.id !== action.id);
      const wasActive = state.levelActive[level] === action.id;
      const nextActive = wasActive
        ? (remaining.length > 0 ? remaining[remaining.length - 1].id : null)
        : state.levelActive[level];
      return {
        ...state,
        levelSets:   { ...state.levelSets,   [level]: remaining },
        levelActive: { ...state.levelActive,  [level]: nextActive },
      };
    }

    case 'CLEAR_LEVEL':
      return {
        ...state,
        levelSets:   { ...state.levelSets,   [level]: [] },
        levelActive: { ...state.levelActive,  [level]: null },
      };

    case 'CLEAR_STORAGE': {
      localStorage.removeItem(LS_KEY);
      _past = [];
      _future = [];
      const fresh: EditorState = {
        levelSets:     emptyLevelSets(),
        levelActive:   emptyLevelActive(),
        currentLevel:  'PumpkinHill', // reset to default
        isDarkMode:    state.isDarkMode,
        language:      state.language ?? 'spa',
        levelSettings: {},
      };
      return fresh;
    }

    case 'IMPORT_SETS': {
      const lastId = action.sets[action.sets.length - 1]?.id ?? null;
      return {
        ...state,
        levelSets:   { ...state.levelSets,   [level]: action.sets },
        levelActive: { ...state.levelActive,  [level]: lastId },
      };
    }

    case 'MOVE_SET_TO_COLUMN':
      return {
        ...state,
        levelSets: mapSets(state, action.id, s => ({ ...s, column: action.column })),
      };

    case 'TOGGLE_DARK_MODE': {
      return { ...state, isDarkMode: !state.isDarkMode };
    }

    case 'UNDO': {
      if (_past.length === 0) return state;
      const prev = _past[_past.length - 1];
      _past = _past.slice(0, -1);
      _future = [state, ..._future.slice(0, MAX_HISTORY - 1)];
      return prev;
    }

    case 'REDO': {
      if (_future.length === 0) return state;
      const next = _future[0];
      _future = _future.slice(1);
      _past = [..._past.slice(-(MAX_HISTORY - 1)), state];
      return next;
    }

    // ─── Set-level mutations ─────────────────────────────────────────────────

    case 'SET_P1_NAME':
      return {
        ...state,
        levelSets: mapSets(state, action.id, s => {
          const updated = { ...s, p1Name: action.value };
          if (levelUsesPredefinedP1(level)) {
            const color = getColorForP1(level, action.value);
            if (color && color !== 'none') updated.borderColor = color;
          }
          return updated;
        }),
      };

    case 'SET_BORDER_COLOR':
      return { ...state, levelSets: mapSets(state, action.id, s => ({ ...s, borderColor: action.color })) };

    case 'SET_COLUMN':
      return { ...state, levelSets: mapSets(state, action.id, s => ({ ...s, column: action.column })) };

    case 'ADD_ROW':
      return {
        ...state,
        levelSets: mapSets(state, action.id, s => ({
          ...s, pieces: [...s.pieces, makeRow()],
        })),
      };

    case 'DELETE_ROW':
      return {
        ...state,
        levelSets: mapSets(state, action.id, s => ({
          ...s, pieces: s.pieces.filter((_, i) => i !== action.ri),
        })),
      };

    case 'REORDER_ROWS':
      return {
        ...state,
        levelSets: mapSets(state, action.id, s => {
          const pieces = [...s.pieces];
          const [moved] = pieces.splice(action.fromRi, 1);
          pieces.splice(action.toRi, 0, moved);
          return { ...s, pieces };
        }),
      };

    case 'SET_P2_TEXT': {
      const isPredefined = levelHasPredefinedP2P3(level);
      return {
        ...state,
        levelSets: mapSets(state, action.id, s => ({
          ...s,
          pieces: s.pieces.map((row, ri) => {
            if (ri !== action.ri) return row;
            const color = isPredefined
              ? (getColorForP2(level, action.value) || row.p2.color)
              : row.p2.color;
            return { ...row, p2: { ...row.p2, text: action.value, color } };
          }),
        })),
      };
    }

    case 'ADD_P3':
      return {
        ...state,
        levelSets: mapSets(state, action.id, s => ({
          ...s,
          pieces: s.pieces.map((row, ri) =>
            ri === action.ri ? { ...row, p3s: [...row.p3s, makePiece()] } : row,
          ),
        })),
      };

    case 'DELETE_P3':
      return {
        ...state,
        levelSets: mapSets(state, action.id, s => ({
          ...s,
          pieces: s.pieces.map((row, ri) =>
            ri === action.ri
              ? { ...row, p3s: row.p3s.filter((_, pi) => pi !== action.pi) }
              : row,
          ),
        })),
      };

    case 'SET_P3_TEXT': {
      const isPredefined = levelHasPredefinedP2P3(level);
      return {
        ...state,
        levelSets: mapSets(state, action.id, s => ({
          ...s,
          pieces: s.pieces.map((row, ri) => {
            if (ri !== action.ri) return row;
            const p3s = row.p3s.map((p3, pi) => {
              if (pi !== action.pi) return p3;
              const color = isPredefined
                ? (getColorForP3(level, action.value) || p3.color)
                : p3.color;
              return { ...p3, text: action.value, color };
            });
            return { ...row, p3s };
          }),
        })),
      };
    }

    case 'TOGGLE_TAG':
      return {
        ...state,
        levelSets: mapSets(state, action.id, s => ({
          ...s,
          pieces: s.pieces.map((row, ri) => {
            if (ri !== action.ri) return row;
            if (action.field === 'p2') {
              const tags = row.p2.tags.includes(action.tag)
                ? row.p2.tags.filter(t => t !== action.tag)
                : [...row.p2.tags, action.tag];
              return { ...row, p2: { ...row.p2, tags } };
            } else {
              const p3s = row.p3s.map((p3, pi) => {
                if (pi !== action.pi) return p3;
                const tags = p3.tags.includes(action.tag)
                  ? p3.tags.filter(t => t !== action.tag)
                  : [...p3.tags, action.tag];
                return { ...p3, tags };
              });
              return { ...row, p3s };
            }
          }),
        })),
      };

    case 'REORDER_P3S':
      return {
        ...state,
        levelSets: mapSets(state, action.id, s => ({
          ...s,
          pieces: s.pieces.map((row, ri) => {
            if (ri !== action.ri) return row;
            const p3s = [...row.p3s];
            const [moved] = p3s.splice(action.fromPi, 1);
            p3s.splice(action.toPi, 0, moved);
            return { ...row, p3s };
          }),
        })),
      };

    case 'REORDER_SETS': {
      const sets = [...state.levelSets[level]];
      const [moved] = sets.splice(action.fromIndex, 1);
      sets.splice(action.toIndex, 0, moved);
      return { ...state, levelSets: { ...state.levelSets, [level]: sets } };
    }

    case 'SET_LANGUAGE':
      return { ...state, language: action.lang };

    case 'SET_LEVEL_SETTINGS':
      return {
        ...state,
        levelSettings: { ...state.levelSettings, [action.level]: action.settings },
      };

    case 'CLEAR_ALL_LEVEL_SETTINGS':
      return { ...state, levelSettings: {} };

    default:
      return state;
  }
}

// ─────────────────────────────────────────────
// WRAPPED REDUCER (handles history + persistence)
// ─────────────────────────────────────────────

function reducer(state: EditorState, action: EditorAction): EditorState {
  // Push to undo history before mutating (except navigation/undo/redo)
  if (!NO_HISTORY_ACTIONS.has(action.type)) {
    _past = [..._past.slice(-(MAX_HISTORY - 1)), state];
    _future = [];
  }

  const next = pureReducer(state, action);

  // Persist to localStorage (skip for undo/redo meta that already saved)
  if (action.type !== 'CLEAR_STORAGE') {
    saveToStorage(next);
  }

  return next;
}

// ─────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────

interface EditorContextValue {
  state:          EditorState;
  dispatch:       React.Dispatch<EditorAction>;
  currentSets:    EditorSet[];
  activeSet:      EditorSet | null;
  getUsedP1s:     () => Set<string>;
  canUndo:        boolean;
  canRedo:        boolean;
  newlyAddedIds:  Set<number>;
  markSetTouched: (id: number) => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<number>>(new Set());

  const sets        = state.levelSets[state.currentLevel];
  const activeSetId = state.levelActive[state.currentLevel];
  const activeSet   = sets.find(s => s.id === activeSetId) ?? null;

  const getUsedP1s = useCallback(
    () => new Set(sets.map(s => s.p1Name).filter(Boolean)),
    [sets],
  );

  // Wrap dispatch to track newly added sets
  const wrappedDispatch = useCallback((action: EditorAction) => {
    if (action.type === 'ADD_SET') {
      // We need the id that will be assigned — peek at the counter
      // The makeSet() call inside reducer uses _idCounter which we can't read,
      // so instead we track by watching levelSets change after dispatch.
      // Simpler: store a pending flag and resolve in an effect.
      _pendingNewSet = true;
    }
    if (action.type === 'SET_P2_TEXT' && action.value.trim()) {
      setNewlyAddedIds(prev => {
        if (!prev.has(action.id)) return prev;
        const next = new Set(prev);
        next.delete(action.id);
        return next;
      });
    }
    dispatch(action);
  }, []);

  // After ADD_SET resolves, find the new set id and mark it
  useEffect(() => {
    if (!_pendingNewSet) return;
    _pendingNewSet = false;
    const newSet = sets[sets.length - 1];
    if (newSet) {
      setNewlyAddedIds(prev => new Set([...prev, newSet.id]));
    }
  }, [sets]);

  const markSetTouched = useCallback((id: number) => {
    setNewlyAddedIds(prev => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  return (
    <EditorContext.Provider value={{
      state, dispatch: wrappedDispatch,
      currentSets: sets,
      activeSet,
      getUsedP1s,
      canUndo: _past.length > 0,
      canRedo: _future.length > 0,
      newlyAddedIds,
      markSetTouched,
    }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be used inside <EditorProvider>');
  return ctx;
}

export function useEditorState(): EditorState {
  return useEditor().state;
}
