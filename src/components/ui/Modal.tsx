import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalVariant = 'info' | 'warning' | 'danger';

interface AlertOptions {
  title?: string;
  message: string;
  variant?: ModalVariant;
  confirmLabel?: string;
}

interface ConfirmOptions extends AlertOptions {
  cancelLabel?: string;
}

interface ModalState {
  open: boolean;
  title: string;
  message: string;
  variant: ModalVariant;
  confirmLabel: string;
  cancelLabel: string | null; // null = alert mode (single button)
  resolve: ((value: boolean) => void) | null;
}

interface ModalContextValue {
  alert:   (opts: AlertOptions)   => Promise<void>;
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ModalContext = createContext<ModalContextValue | null>(null);

const VARIANT_ICONS: Record<ModalVariant, string> = {
  info:    'ℹ',
  warning: '⚠',
  danger:  '✕',
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState>({
    open: false,
    title: '',
    message: '',
    variant: 'info',
    confirmLabel: 'Aceptar',
    cancelLabel: null,
    resolve: null,
  });

  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // Focus confirm button when modal opens
  useEffect(() => {
    if (modal.open) {
      setTimeout(() => confirmBtnRef.current?.focus(), 50);
    }
  }, [modal.open]);

  // Close on Escape
  useEffect(() => {
    if (!modal.open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleCancel();
      if (e.key === 'Enter')  handleConfirm();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal.open]);

  function openModal(opts: ModalState) {
    setModal({ ...opts, open: true });
  }

  function handleConfirm() {
    modal.resolve?.(true);
    setModal(m => ({ ...m, open: false, resolve: null }));
  }

  function handleCancel() {
    modal.resolve?.(false);
    setModal(m => ({ ...m, open: false, resolve: null }));
  }

  const alert = useCallback((opts: AlertOptions): Promise<void> => {
    return new Promise(resolve => {
      openModal({
        open: true,
        title:        opts.title        ?? '',
        message:      opts.message,
        variant:      opts.variant      ?? 'info',
        confirmLabel: opts.confirmLabel ?? 'Aceptar',
        cancelLabel:  null,
        resolve: () => resolve(),
      });
    });
  }, []);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      openModal({
        open: true,
        title:        opts.title        ?? '',
        message:      opts.message,
        variant:      opts.variant      ?? 'warning',
        confirmLabel: opts.confirmLabel ?? 'Aceptar',
        cancelLabel:  opts.cancelLabel  ?? 'Cancelar',
        resolve,
      });
    });
  }, []);

  return (
    <ModalContext.Provider value={{ alert, confirm }}>
      {children}

      {modal.open && (
        <div className="modal-backdrop" onClick={handleCancel}>
          <div
            className={`modal-box modal-box--${modal.variant}`}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="modal-header">
              <span className={`modal-icon modal-icon--${modal.variant}`}>
                {VARIANT_ICONS[modal.variant]}
              </span>
              {modal.title && (
                <h3 id="modal-title" className="modal-title">{modal.title}</h3>
              )}
            </div>

            <p className="modal-message">{modal.message}</p>

            <div className="modal-actions">
              {modal.cancelLabel && (
                <button className="modal-btn modal-btn--cancel" onClick={handleCancel}>
                  {modal.cancelLabel}
                </button>
              )}
              <button
                ref={confirmBtnRef}
                className={`modal-btn modal-btn--confirm modal-btn--${modal.variant}`}
                onClick={handleConfirm}
              >
                {modal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used inside <ModalProvider>');
  return ctx;
}
