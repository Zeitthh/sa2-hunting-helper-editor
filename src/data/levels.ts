import type { LevelKey } from '../types/editor';

export interface LevelMeta {
  key: LevelKey;
  label: string;
}

export interface LevelGroup {
  separator: string;
  levels: LevelMeta[];
}

export const LEVELS: LevelMeta[] = [
  { key: 'PumpkinHill',   label: 'Pumpkin Hill' },
  { key: 'PumpkinHillNG', label: 'Pumpkin Hill NG' },
  { key: 'AquaticMine',   label: 'Aquatic Mine' },
  { key: 'DeathChamber',  label: 'Death Chamber' },
  { key: 'MeteorHerd',    label: 'Meteor Herd' },
  { key: 'DryLagoon',     label: 'Dry Lagoon' },
  { key: 'EggQuarters',   label: 'Egg Quarters' },
  { key: 'EggQuartersNG', label: 'Egg Quarters NG' },
  { key: 'SecurityHall',  label: 'Security Hall' },
  { key: 'MadSpace',      label: 'Mad Space' },
];

/** Groups for sidebar display with separators */
export const LEVEL_GROUPS: LevelGroup[] = [
  {
    separator: 'Hero',
    levels: [
      { key: 'PumpkinHill',   label: 'Pumpkin Hill' },
      { key: 'PumpkinHillNG', label: 'Pumpkin Hill NG' },
      { key: 'AquaticMine',   label: 'Aquatic Mine' },
      { key: 'DeathChamber',  label: 'Death Chamber' },
      { key: 'MeteorHerd',    label: 'Meteor Herd' },
    ],
  },
  {
    separator: 'Dark',
    levels: [
      { key: 'DryLagoon',     label: 'Dry Lagoon' },
      { key: 'EggQuarters',   label: 'Egg Quarters' },
      { key: 'EggQuartersNG', label: 'Egg Quarters NG' },
      { key: 'SecurityHall',  label: 'Security Hall' },
      { key: 'MadSpace',     label: 'Mad Space' },
    ],
  },
];

/** Levels that use predefined P1 dropdown lists */
export const PREDEFINED_P1_LEVELS: LevelKey[] = ['PumpkinHill', 'PumpkinHillNG', 'DeathChamber'];

/** Levels that use predefined P2/P3 dropdown lists */
export const PREDEFINED_P2P3_LEVELS: LevelKey[] = ['PumpkinHill', 'PumpkinHillNG', 'DeathChamber'];

export function levelUsesPredefinedP1(level: LevelKey): boolean {
  return PREDEFINED_P1_LEVELS.includes(level);
}

export function levelHasPredefinedP2P3(level: LevelKey): boolean {
  return PREDEFINED_P2P3_LEVELS.includes(level);
}

/** @deprecated use levelHasPredefinedP2P3 */
export const levelUsesPredefinedP2P3 = levelHasPredefinedP2P3;

// ─── Level accent colors (for active item border, etc.) ──────────────────────
export const LEVEL_ACCENT: Record<LevelKey, string> = {
  PumpkinHill:   '#e06666', // rojo
  PumpkinHillNG: '#ea9999', // rojo claro
  AquaticMine:   '#7c7ee0', // indigo
  DeathChamber:  '#e69138', // naranja
  MeteorHerd:    '#a0a0b0', // gris distintivo
  DryLagoon:     '#6aa84f', // verde
  EggQuarters:   '#e844a0', // rosa mexicano
  EggQuartersNG: '#f48fb1', // rosa claro
  SecurityHall:  '#f1c232', // amarillo
  MadSpace:      '#9c27b0', // violeta
};

// ─── PH / PH-NG group classification by color ─────────────────────────────────
// Blue shades → Church | Green shades → Ghost Train | Red shades → Pumpkin

const CHURCH_COLORS     = new Set(['#6d9eeb', '#3c78d8', '#a4c2f4', '#a4c2ec']);
const GHOST_TRAIN_COLORS = new Set(['#b6d7a8', '#93c47d']);
const PUMPKIN_COLORS    = new Set(['#e06666', '#ea9999']);

export type PH_Group = 'all' | 'church' | 'ghost_train' | 'pumpkin';

export const PH_GROUP_LABELS: Record<PH_Group, string> = {
  all:         'Todos',
  church:      'Church',
  ghost_train: 'Ghost Train',
  pumpkin:     'Pumpkin',
};

export function getP1Group(color: string): Exclude<PH_Group, 'all'> {
  if (CHURCH_COLORS.has(color))      return 'church';
  if (GHOST_TRAIN_COLORS.has(color)) return 'ghost_train';
  if (PUMPKIN_COLORS.has(color))     return 'pumpkin';
  return 'pumpkin'; // fallback
}

export function levelHasPHGroups(level: LevelKey): boolean {
  return level === 'PumpkinHill' || level === 'PumpkinHillNG';
}
