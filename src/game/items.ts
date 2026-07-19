// PRD FR-10~12 밸런스 초안 — addendum.md "아이템 밸런스 초안 — FR-12" 참고, 플레이테스트로 조정
export type ItemType = "timeBoost" | "mismatchShield" | "doubleReward";

interface ItemDef {
  type: ItemType;
  label: string;
  description: string;
  weight: number;
}

export const ITEM_POOL: ItemDef[] = [
  {
    type: "timeBoost",
    label: "시간 회복",
    description: "제한시간 +5초 즉시 추가",
    weight: 40,
  },
  {
    type: "mismatchShield",
    label: "오답 무효화",
    description: "다음 미스매치 1회 페널티 없음",
    weight: 40,
  },
  {
    type: "doubleReward",
    label: "재화 2배",
    description: "다음 스테이지 클리어 시 재화 획득량 2배",
    weight: 20,
  },
];

export const PULL_COST = 3;

export function rollItem(): ItemType {
  const totalWeight = ITEM_POOL.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const item of ITEM_POOL) {
    if (roll < item.weight) return item.type;
    roll -= item.weight;
  }

  return ITEM_POOL[ITEM_POOL.length - 1].type;
}

export function itemDef(type: ItemType): ItemDef {
  return ITEM_POOL.find((item) => item.type === type)!;
}
