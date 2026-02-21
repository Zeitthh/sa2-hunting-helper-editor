/**
 * levelData.ts — unified accessor for per-level predefined lists.
 */
import type { LevelKey } from '../types/editor';
import type { P1Entry, P2Entry, P3Entry } from '../types/editor';
import {
  PUMPKIN_HILL_P1_LIST,
  PUMPKIN_HILL_P2_LIST,
  PUMPKIN_HILL_P3_LIST,
  PUMPKIN_HILL_NG_P1_LIST,
  PUMPKIN_HILL_NG_P2_LIST,
  PUMPKIN_HILL_NG_P3_LIST,
} from './pumpkinHill';
import {
  DEATH_CHAMBER_P1_LIST,
  DEATH_CHAMBER_P2_LIST,
  DEATH_CHAMBER_P3_LIST,
} from './deathChamber';

// ─── Per-level list registry ──────────────────────────────────────────────────

const P1_LISTS: Partial<Record<LevelKey, P1Entry[]>> = {
  PumpkinHill:   PUMPKIN_HILL_P1_LIST,
  PumpkinHillNG: PUMPKIN_HILL_NG_P1_LIST,
  DeathChamber:  DEATH_CHAMBER_P1_LIST,
};

const P2_LISTS: Partial<Record<LevelKey, P2Entry[]>> = {
  PumpkinHill:   PUMPKIN_HILL_P2_LIST,
  PumpkinHillNG: PUMPKIN_HILL_NG_P2_LIST,
  DeathChamber:  DEATH_CHAMBER_P2_LIST,
};

const P3_LISTS: Partial<Record<LevelKey, P3Entry[]>> = {
  PumpkinHill:   PUMPKIN_HILL_P3_LIST,
  PumpkinHillNG: PUMPKIN_HILL_NG_P3_LIST,
  DeathChamber:  DEATH_CHAMBER_P3_LIST,
};

// ─── Public accessors ─────────────────────────────────────────────────────────

export function getP1List(level: LevelKey): P1Entry[] {
  const list = P1_LISTS[level] ?? [];
  return [...list].sort((a, b) => a.p1.localeCompare(b.p1, 'es'));
}

export function getP2List(level: LevelKey): P2Entry[] {
  return P2_LISTS[level] ?? [];
}

export function getP3List(level: LevelKey): P3Entry[] {
  return P3_LISTS[level] ?? [];
}

export function getColorForP1(level: LevelKey, p1: string): string {
  return P1_LISTS[level]?.find(e => e.p1 === p1)?.color ?? '';
}

export function getColorForP2(level: LevelKey, p2: string): string {
  return P2_LISTS[level]?.find(e => e.p2 === p2)?.color ?? '';
}

export function getColorForP3(level: LevelKey, p3: string): string {
  return P3_LISTS[level]?.find(e => e.p3 === p3)?.color ?? '';
}
