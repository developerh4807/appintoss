import type { BadgeShape } from "./balance";
import { BADGE_SHAPES } from "./balance";

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
  /** 보조 도형 배지. 배지 구간(스테이지 10~)에서만 붙고, 그 전엔 undefined다. */
  badge?: BadgeShape;
}

// MAX_TILES / 2 must not exceed TILE_ICONS.length, or pairs beyond that start reusing icons.
// [2026-08-11] 24 고정 — 07-25 스펙의 24→36 확장은 "그리드 고정" 결정으로 폐기됐다.
// 난이도는 그리드가 아니라 순차 숨김·배지·풀 축소 세 축으로 올린다.
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

interface BoardOptions {
  /** 이 스테이지에서 쓸 아이콘 목록. 후반일수록 좁아진다. */
  iconPool: string[];
  /** 배지 종수(0이면 배지 없음). 풀이 좁아진 만큼 조합 공간을 벌어주는 역할도 한다. */
  badgeCount: number;
}

/**
 * 스테이지 보드를 만든다.
 *
 * 각 쌍은 **(아이콘, 배지) 조합이 유일**해야 한다 — 같은 조합이 두 쌍 생기면 네 장이
 * 서로 매치돼 퍼즐이 깨진다. 그래서 조합 공간(풀 × 배지종수)이 필요한 쌍 수보다
 * 작으면 즉시 드러나도록 가드를 둔다. 구간표를 나중에 손댈 때 조용히 깨지는 걸 막는다.
 */
export function generateBoard(stage: number, options: BoardOptions): Tile[] {
  const { iconPool, badgeCount } = options;
  const pairCount = tilesForStage(stage) / 2;
  const combinationSpace = iconPool.length * Math.max(1, badgeCount);

  if (combinationSpace < pairCount) {
    // 밸런스 구간표가 깨진 상태다. 던지는 대신 경고하고 아이콘 재사용으로 진행한다 —
    // 플레이 중 크래시보다는 난이도가 잠깐 어긋나는 편이 낫다.
    console.error(
      `보드 조합 공간 부족: 스테이지 ${stage}에 ${pairCount}쌍이 필요한데 ` +
        `풀 ${iconPool.length} × 배지 ${badgeCount || 1} = ${combinationSpace}뿐입니다. ` +
        `balance.ts의 iconPoolForStage/badgeCountForStage 구간표를 확인하세요.`,
    );
  }

  // (아이콘, 배지) 조합을 **아이콘 바깥 / 배지 안쪽** 순서로 펼친다.
  // 순서를 뒤집으면(배지 바깥) 아이콘 12종만으로 12쌍이 다 채워져 배지가 전부 첫 종류로
  // 몰리고, "모양+배지를 함께 봐야 한다"는 난이도 축이 통째로 죽는다.
  // 이 순서면 같은 아이콘이 서로 다른 배지로 갈라져 conjunction search가 실제로 요구된다.
  const combos: Array<{ icon: string; badge?: BadgeShape }> = [];
  const badges: Array<BadgeShape | undefined> =
    badgeCount > 0 ? BADGE_SHAPES.slice(0, badgeCount) : [undefined];

  for (let i = 0; i < iconPool.length && combos.length < pairCount; i++) {
    for (let b = 0; b < badges.length && combos.length < pairCount; b++) {
      combos.push({ icon: iconPool[i], badge: badges[b] });
    }
  }

  // 조합 공간이 모자랄 때만 도는 보충 루프 — 현재 구간표에서는 실행되지 않는다(위 가드가
  // 이미 경고를 남긴 상태). 조합을 앞에서부터 재사용하므로 쌍 고유성이 깨지지만,
  // 플레이 중 크래시보다는 낫다는 판단이다.
  for (let i = 0; combos.length < pairCount; i++) {
    combos.push({ ...combos[i % Math.max(1, combos.length)] });
  }

  const shuffled = shuffle([...combos, ...combos]);

  return shuffled.map((combo, index) => ({
    id: `${stage}-${index}`,
    icon: combo.icon,
    badge: combo.badge,
  }));
}

interface MatchOptions {
  /** true면 아이콘뿐 아니라 배지까지 같아야 매치가 성립한다. */
  badgeRequired: boolean;
}

export function isMatch(a: Tile, b: Tile, options?: MatchOptions): boolean {
  if (a.id === b.id) return false;
  if (a.icon !== b.icon) return false;
  // 숨김 여부는 매치 판정에 영향을 주지 않는다 — 숨김은 순수하게 표현(presentation)
  // 상태이고, 판정은 언제나 실제 icon/badge로 이뤄진다.
  if (options?.badgeRequired) return a.badge === b.badge;
  return true;
}
