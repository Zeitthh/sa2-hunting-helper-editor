import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  type ReactNode,
  type CSSProperties,
} from 'react';

interface TooltipState {
  visible: boolean;
  text: string;
  x: number;
  y: number;
  placement: 'top' | 'bottom';
}

interface TooltipContextValue {
  show: (text: string, rect: DOMRect) => void;
  hide: () => void;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

export function TooltipProvider({ children }: { children: ReactNode }) {
  const [tip, setTip] = useState<TooltipState>({ visible: false, text: '', x: 0, y: 0, placement: 'top' });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((text: string, rect: DOMRect) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const placement = rect.top > 60 ? 'top' : 'bottom';
      const x = rect.left + rect.width / 2;
      const y = placement === 'top' ? rect.top - 8 : rect.bottom + 8;
      setTip({ visible: true, text, x, y, placement });
    }, 320);
  }, []);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setTip(prev => ({ ...prev, visible: false }));
  }, []);

  const style: CSSProperties = {
    position: 'fixed',
    left: tip.x,
    top: tip.y,
    transform: tip.placement === 'top'
      ? 'translate(-50%, -100%)'
      : 'translate(-50%, 0)',
    pointerEvents: 'none',
    zIndex: 9999,
    opacity: tip.visible ? 1 : 0,
    transition: 'opacity 0.1s ease',
  };

  return (
    <TooltipContext.Provider value={{ show, hide }}>
      {children}
      <div className="tooltip-box" style={style} aria-hidden>
        {tip.text}
        <div className={`tooltip-arrow tooltip-arrow--${tip.placement}`} />
      </div>
    </TooltipContext.Provider>
  );
}

export function useTooltipCtx() {
  return useContext(TooltipContext);
}

// ─── Tooltip wrapper component ────────────────────────────────────────────────

interface TooltipProps {
  text: string;
  children: ReactNode;
  disabled?: boolean;
}

export function Tooltip({ text, children, disabled }: TooltipProps) {
  const ctx = useTooltipCtx();

  function onMouseEnter(e: React.MouseEvent) {
    if (!ctx || disabled || !text) return;
    ctx.show(text, (e.currentTarget as HTMLElement).getBoundingClientRect());
  }

  function onMouseLeave() {
    ctx?.hide();
  }

  return (
    <span
      className="tooltip-wrapper"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={e => ctx?.show(text, e.currentTarget.getBoundingClientRect())}
      onBlur={() => ctx?.hide()}
    >
      {children}
    </span>
  );
}
