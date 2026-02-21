// ─────────────────────────────────────────────
// TYPES — editor.ts
// ─────────────────────────────────────────────

/** A single huntable piece (P2 or P3) */
export interface Piece {
  text: string;
  tags: string[];
  color: string;
}

/** One row: a P2 with one or more P3s */
export interface PieceRow {
  p2: Piece;
  p3s: Piece[];
}

/** A full set, keyed by a unique numeric id */
export interface EditorSet {
  id: number;
  p1Name: string;
  borderColor: string;
  column: 'default' | 'left' | 'center' | 'right';
  pieces: PieceRow[];
}

/** All available levels */
export type LevelKey =
  | 'PumpkinHill'
  | 'PumpkinHillNG'
  | 'AquaticMine'
  | 'DeathChamber'
  | 'MeteorHerd'
  | 'DryLagoon'
  | 'EggQuarters'
  | 'EggQuartersNG'
  | 'SecurityHall'
  | 'MadSpace';
/** Color entry used in palettes */
export interface ColorEntry {
  value: string;
  label: string;
  css: string | null;
}

/** P1 predefined entry (Pumpkin Hill, etc.) */
export interface P1Entry {
  p1: string;
  color: string;
}

/** P2 predefined entry */
export interface P2Entry {
  p2: string;
  color: string;
}

/** P3 predefined entry */
export interface P3Entry {
  p3: string;
  color: string;
  isEmoji: boolean;
}
