// PRD FR-10~12 밸런스 초안 — addendum.md "아이템 밸런스 초안 — FR-12" 참고, 플레이테스트로 조정
export type ItemType = "timeBoost" | "mismatchShield" | "doubleReward";

interface ItemDef {
  type: ItemType;
  /** i18n 키 — 표시 문자열은 호출부가 t()로 푼다(itemLabelKey/itemDescriptionKey 참고). */
  labelKey: string;
  descriptionKey: string;
  weight: number;
}

// [UPDATED 2026-08-13] 40/40/20 → 44/44/12. 실기기 플레이테스트 피드백: 재화 2배가
// 뽑기 밸런스를 흔든다는 지적 — 재화가 런마다 누적되는 구조(items.ts:40 주석 참고)에서
// 2배 획득이 자주 뜨면 "모아서 쓰는" 긴장감이 빨리 무너진다. weight를 20→12로 낮추고,
// 남는 비중은 스택형으로 바뀐 두 아이템(시간 회복·미스매치 방패)에 동일하게 나눴다.
export const ITEM_POOL: ItemDef[] = [
  {
    type: "timeBoost",
    labelKey: "items.timeBoost.label",
    // [UPDATED 2026-08-11] 즉시 적용이 아니라 다음 스테이지에 얹히는 보류 효과다 —
    // 아이템을 스테이지 시작 전에만 쓰도록 바뀌면서(⑤) 동작이 함께 바뀌었다.
    descriptionKey: "items.timeBoost.description",
    weight: 44,
  },
  {
    type: "mismatchShield",
    labelKey: "items.mismatchShield.label",
    descriptionKey: "items.mismatchShield.description",
    weight: 44,
  },
  {
    type: "doubleReward",
    labelKey: "items.doubleReward.label",
    descriptionKey: "items.doubleReward.description",
    weight: 12,
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
