import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface SavedContextValue {
  showSaved: () => void;
}

const SavedContext = createContext<SavedContextValue | null>(null);

export function SavedProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);

  const showSaved = useCallback(() => {
    setVisible(true);
    setTimeout(() => setVisible(false), 1800);
  }, []);

  return (
    <SavedContext.Provider value={{ showSaved }}>
      {children}
      <div className={`saved-indicator${visible ? ' saved-indicator--visible' : ''}`}>
        ✓ Guardado
      </div>
    </SavedContext.Provider>
  );
}

export function useSaved(): SavedContextValue {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error('useSaved must be used inside <SavedProvider>');
  return ctx;
}
