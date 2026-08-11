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
    label: "미스매치 방패",
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

export const ITEM_ILLUSTRATIONS: Record<ItemType, string> = {
  timeBoost: "🐿️⏱️",
  mismatchShield: "🦔🛡️",
  doubleReward: "🦝🪙",
};

// [UPDATED 2026-08-11] 3 → 12. 오락실 런 리셋 모델(②)에서 재화가 런마다 리셋되지 않고
// 계속 누적되도록 확정되면서, 기존 수치(클리어 +10 / 뽑기 3)는 클리어 1회로 뽑기를 3회
// 넘게 할 수 있어 후반에 재화가 남아돌고 아이템 희소성이 사라진다.
// 클리어 1회당 뽑기 1회 미만(10/12)이 되도록 올려 "모아서 쓰는" 감각을 만든다.
// [ASSUMPTION] 정확한 수치는 ①의 난이도 커브(런 평균 길이) 확정 후 플레이테스트로 조정.
export const PULL_COST = 12;

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
