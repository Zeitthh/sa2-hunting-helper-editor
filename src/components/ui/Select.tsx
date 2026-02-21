import {
  useState,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';

export interface SelectOption {
  value: string;
  label: string;
  color?: string;
  disabled?: boolean;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

export type SelectItem = SelectOption | SelectGroup;

function isGroup(item: SelectItem): item is SelectGroup {
  return 'options' in item;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  items: SelectItem[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  noCheck?: boolean; // suppress checkmark (use color dot only)
}

export function Select({ value, onChange, items, placeholder, className, disabled, noCheck }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Find selected label + color
  let selectedLabel = placeholder ?? '—';
  let selectedColor: string | undefined;

  function findInItems(items: SelectItem[]) {
    for (const item of items) {
      if (isGroup(item)) {
        for (const opt of item.options) {
          if (opt.value === value) { selectedLabel = opt.label; selectedColor = opt.color; return; }
        }
      } else {
        if (item.value === value) { selectedLabel = item.label; selectedColor = item.color; return; }
      }
    }
  }
  findInItems(items);

  function renderOptions(options: SelectOption[]): ReactNode {
    return options.map(opt => (
      <button
        key={opt.value}
        className={[
          'custom-select-option',
          opt.value === value ? 'custom-select-option--selected' : '',
          opt.disabled ? 'custom-select-option--disabled' : '',
        ].filter(Boolean).join(' ')}
        onClick={() => {
          if (!opt.disabled) { onChange(opt.value); setOpen(false); }
        }}
        type="button"
      >
        {opt.color && (
          <span className="custom-select-dot" style={{ background: opt.color }} />
        )}
        <span className="custom-select-opt-label">{opt.label}</span>
        {!noCheck && opt.value === value && <span className="custom-select-check">✓</span>}
      </button>
    ));
  }

  return (
    <div
      ref={ref}
      className={['custom-select', className, disabled ? 'custom-select--disabled' : '', open ? 'custom-select--open' : ''].filter(Boolean).join(' ')}
    >
      <button
        className="custom-select-trigger"
        onClick={() => !disabled && setOpen(o => !o)}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="custom-select-value">
          {selectedColor && (
            <span className="custom-select-dot" style={{ background: selectedColor }} />
          )}
          <span>{selectedLabel}</span>
        </span>
        <span className={`custom-select-chevron${open ? ' custom-select-chevron--open' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="custom-select-dropdown" role="listbox">
          {items.map((item, i) => {
            if (isGroup(item)) {
              return (
                <div key={i} className="custom-select-group">
                  <div className="custom-select-group-label">{item.label}</div>
                  {renderOptions(item.options)}
                </div>
              );
            }
            return renderOptions([item]);
          })}
        </div>
      )}
    </div>
  );
}
