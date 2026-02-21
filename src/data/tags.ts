import type { LevelKey } from '../types/editor';

const TAGS_BY_LEVEL: Partial<Record<LevelKey, string[]>> & { _default: string[] } = {
  PumpkinHill:   ['disambiguation', 'dangerousmaterial'],
  PumpkinHillNG: ['disambiguation', 'dangerousmaterial'],
  EggQuarters:   ['disambiguation', 'darksonicblue', 'darksonicaltar'],
  EggQuartersNG: ['disambiguation', 'darksonicblue', 'darksonicaltar'],
  _default:      ['disambiguation'],
};

export function getTagsForLevel(level: LevelKey): string[] {
  return TAGS_BY_LEVEL[level] ?? TAGS_BY_LEVEL._default;
}
