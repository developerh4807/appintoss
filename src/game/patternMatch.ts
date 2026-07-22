export const TILE_ICONS = [
  "🐶",
  "🐱",
  "🐰",
  "🐻",
  "🐼",
  "🦊",
  "🐨",
  "🐯",
  "🦁",
  "🐷",
  "🐮",
  "🐸",
];

export interface Tile {
  id: string;
  icon: string;
}

// MAX_TILES / 2 must not exceed TILE_ICONS.length, or pairs beyond that start reusing icons.
const MAX_TILES = 24;
const TILES_PER_STAGE = 2;
const BASE_TILES = 6;

export function tilesForStage(stage: number): number {
  return Math.min(BASE_TILES + (stage - 1) * TILES_PER_STAGE, MAX_TILES);
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generateBoard(stage: number): Tile[] {
  const pairCount = tilesForStage(stage) / 2;
  const icons = Array.from(
    { length: pairCount },
    (_, i) => TILE_ICONS[i % TILE_ICONS.length],
  );
  const shuffledIcons = shuffle([...icons, ...icons]);

  return shuffledIcons.map((icon, index) => ({
    id: `${stage}-${index}`,
    icon,
  }));
}

export function isMatch(a: Tile, b: Tile): boolean {
  return a.id !== b.id && a.icon === b.icon;
}
