import type { ColorEntry, LevelKey } from '../types/editor';

export const BORDER_COLORS: ColorEntry[] = [
  { value: 'none',     label: 'Sin color',    css: '#ddd' },
  { value: 'red',      label: 'Rojo',         css: 'red' },
  { value: '#ff6666',  label: 'Rojo claro',   css: '#ff6666' },
  { value: 'blue',     label: 'Azul',         css: 'blue' },
  { value: '#5599ff',  label: 'Azul celeste', css: '#5599ff' },
  { value: 'green',    label: 'Verde',        css: 'green' },
  { value: '#55cc55',  label: 'Verde claro',  css: '#55cc55' },
  { value: 'purple',   label: 'Morado',       css: 'purple' },
  { value: '#bb66ff',  label: 'Morado claro', css: '#bb66ff' },
  { value: '#804000',  label: 'Café',         css: '#804000' },
  { value: '#cc7722',  label: 'Café claro',   css: '#cc7722' },
  { value: 'orange',   label: 'Naranja',      css: 'orange' },
  { value: '#ffcc44',  label: 'Amarillo',     css: '#ffcc44' },
];

export const GENERIC_PIECE_COLORS: ColorEntry[] = [
  { value: '',         label: 'Ninguno',       css: null },
  { value: 'red',      label: 'Rojo',          css: 'red' },
  { value: '#ff6666',  label: 'Rojo claro',    css: '#ff6666' },
  { value: 'blue',     label: 'Azul',          css: 'blue' },
  { value: '#5599ff',  label: 'Azul celeste',  css: '#5599ff' },
  { value: 'green',    label: 'Verde',         css: 'green' },
  { value: '#55cc55',  label: 'Verde claro',   css: '#55cc55' },
  { value: 'purple',   label: 'Morado',        css: 'purple' },
  { value: '#bb66ff',  label: 'Morado claro',  css: '#bb66ff' },
  { value: '#804000',  label: 'Café',          css: '#804000' },
  { value: '#cc7722',  label: 'Café claro',    css: '#cc7722' },
  { value: 'orange',   label: 'Naranja',       css: 'orange' },
  { value: '#ffcc44',  label: 'Amarillo',      css: '#ffcc44' },
];

export const PUMPKIN_HILL_PIECE_COLORS: ColorEntry[] = [
  { value: '',        label: 'Ninguno',      css: null },
  { value: '#1155cc', label: 'Azul oscuro',  css: '#1155cc' },
  { value: '#3c78d8', label: 'Azul',         css: '#3c78d8' },
  { value: '#6d9eeb', label: 'Azul claro',   css: '#6d9eeb' },
  { value: '#a4c2f4', label: 'Azul pastel',  css: '#a4c2f4' },
  { value: '#f4cccc', label: 'Rosa claro',   css: '#f4cccc' },
  { value: '#ead1dc', label: 'Rosa medio',   css: '#ead1dc' },
  { value: '#dd7e6b', label: 'Rojo',         css: '#dd7e6b' },
  { value: '#d9ead3', label: 'Verde claro',  css: '#d9ead3' },
  { value: '#b6d7a8', label: 'Verde medio',  css: '#b6d7a8' },
  { value: '#93c47d', label: 'Verde oscuro', css: '#93c47d' },
];

export function getPieceColorsForLevel(level: LevelKey): ColorEntry[] {
  if (level === 'PumpkinHill' || level === 'PumpkinHillNG') {
    return PUMPKIN_HILL_PIECE_COLORS;
  }
  return GENERIC_PIECE_COLORS;
}

/** Map legacy Bootstrap border class names to CSS colors */
export function cssColorFromBootstrap(borderClass: string): string {
  const map: Record<string, string> = {
    danger:  'red',
    primary: 'blue',
    success: 'green',
    warning: 'orange',
    purple:  'purple',
    brown:   '#804000',
  };
  return map[borderClass] ?? borderClass;
}
