import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { EditorProvider } from './store/editorStore';
import { ModalProvider } from './components/ui/Modal';
import { ToastProvider } from './components/ui/Toast';
import { SavedProvider } from './components/ui/SavedIndicator';
import { TooltipProvider } from './components/ui/Tooltip';
import { App } from './App';
import './styles/globals.scss';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <EditorProvider>
      <ModalProvider>
        <ToastProvider>
          <SavedProvider>
            <TooltipProvider>
              <App />
            </TooltipProvider>
          </SavedProvider>
        </ToastProvider>
      </ModalProvider>
    </EditorProvider>
  </StrictMode>,
);
