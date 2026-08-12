// PRD FR-3/FR-5/FR-7 밸런스 초안 — 정확한 수치는 플레이테스트로 조정 (addendum.md 참고)
// [UPDATED 2026-08-11] 순차 숨김 도입 구간(스테이지 4~)의 경계로도 재사용된다 —
// 새 상수를 만들지 않고 "유예 구간"이라는 같은 개념을 공유한다.
export const GRACE_STAGE_LIMIT = 3;
const GRACE_SECONDS = 15;
const TIME_DECREASE_PER_STAGE = 1;
const MIN_STAGE_SECONDS = 5;

export const MISMATCH_PENALTY_SECONDS = 3;
// [NEW 2026-08-11] 시간 회복 아이템이 다음 스테이지에 얹어주는 보너스 초.
// ⑤에서 아이템 사용 지점이 "스테이지 시작 전"으로 일원화되면서, 이 아이템도 즉시효과가
// 아니라 다음 스테이지에 적용되는 보류 효과가 됐다 — 즉시 적용하면 스테이지 전환 시
// timer.reset()이 덮어써서 효과가 사라진다.
export const TIME_BOOST_BONUS_SECONDS = 5;
// [UPDATED 2026-08-11] 세 번째 방향 전환 — 스테이지별 2회(07-18) → 하루 3회(07-22) →
// 런당 2회(08-11). 오락실(런 리셋) 모델로 전환하면서 하루 단위 상한은 런당 카운트와
// 중복 제약이라 폐기했다(useGlobalRetryCap.ts → useRunState.ts).
// 무료 2회 + 광고 1회 = 총 3회를 모두 소진하면 스테이지 1로 리셋되고 다시 2회로 리충된다.
// 광고 일일 상한(useDailyAdCap.ts, FR-16)은 광고 과다 노출 방지 장치라 성격이 달라 유지.
export const FREE_RETRIES_PER_RUN = 2;
export const CRITICAL_TIME_RATIO = 0.25;

export function initialSecondsForStage(stage: number): number {
  if (stage <= GRACE_STAGE_LIMIT) return GRACE_SECONDS;
  const decreased =
    GRACE_SECONDS - (stage - GRACE_STAGE_LIMIT) * TIME_DECREASE_PER_STAGE;
  return Math.max(MIN_STAGE_SECONDS, decreased);
}

// ─────────────────────────────────────────────────────────────────────────────
// [NEW 2026-08-11] 난이도 파생 — spec-pattern-match-difficulty.md 구간표의 SoT.
//
// 그리드(MAX_TILES 24)와 제한시간(하한 5초)은 스테이지 13에서 둘 다 멈춘다. 그 이후로도
// 난이도가 계속 오르게 하는 축이 여기 있는 셋이다: 순차 숨김 · 변장 · 아이콘 풀 축소.
// 축이 동시에 뛰지 않도록 구간을 어긋 배치했다(스펙 "통합 스테이지 구간표" 참고).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 매치 판별에 쓰는 **변장 아이템**. 같은 동물이라도 변장이 다르면 다른 타일이다.
 *
 * [UPDATED 2026-08-11] 처음엔 도형 배지(●▲■◆)였으나 UX가 무미건조하다는 피드백으로
 * 변장 컨셉으로 교체했다. 색이 아니라 **형태**가 판별 기준이라는 접근성 계약은 그대로다 —
 * 안경·모자는 실루엣이 서로 뚜렷이 달라 도형보다 오히려 구별이 쉽다.
 *
 * 순서는 구별하기 쉬운 것부터다(변장 종수가 스테이지에 따라 앞에서부터 늘어나므로,
 * 초반 구간일수록 쉬운 조합만 등장한다).
 */
export const DISGUISES = ["🕶️", "🎩", "🎀", "👑"] as const;
export type Disguise = (typeof DISGUISES)[number];

/** 스크린리더용 이름 — 이모지 그대로 읽히면 무엇을 쓴 건지 전달되지 않는다. */
export const DISGUISE_LABELS: Record<Disguise, string> = {
  "🕶️": "선글라스",
  "🎩": "모자",
  "🎀": "리본",
  "👑": "왕관",
};

// 실루엣이 비슷한 것끼리 묶은 그룹. 풀을 좁히면 서로 헷갈리는 아이콘만 남아 난이도가 오른다.
// 그룹 크기가 2~4로 고르지 않아 "단일 그룹"으로는 12쌍을 못 채운다 — 그래서 아래
// iconPoolForStage는 그룹을 블렌드해 필요한 풀 크기를 만든다.
const ICON_GROUPS = {
  canine: ["🐶", "🦊"],
  feline: ["🐱", "🐯", "🦁"],
  bear: ["🐻", "🐼", "🐨"],
  misc: ["🐰", "🐷", "🐮", "🐸"],
} as const;

/**
 * 이 스테이지에서 쓸 아이콘 풀. 후반으로 갈수록 좁혀 변별을 어렵게 한다.
 *
 * 풀을 좁히면 (풀 × 변장종수) 조합 공간이 줄어 쌍 고유성이 깨질 수 있으므로,
 * **변장이 먼저 도입된 뒤에** 좁히는 순서를 지킨다(스펙 AD-4).
 */
export function iconPoolForStage(stage: number): string[] {
  // 20+ : 풀 3 — 곰·판다과 단독. 변장 4종과 곱해 정확히 12쌍이 나온다(더 줄이면 깨진다).
  if (stage >= 20) return [...ICON_GROUPS.bear];
  // 13~19 : 풀 6 — 고양이과 + 곰·판다과. 둘 다 둥근 얼굴이라 서로 헷갈린다.
  if (stage >= 13) return [...ICON_GROUPS.feline, ...ICON_GROUPS.bear];
  // 1~12 : 전체 12종
  return [
    ...ICON_GROUPS.canine,
    ...ICON_GROUPS.feline,
    ...ICON_GROUPS.bear,
    ...ICON_GROUPS.misc,
  ];
}

/** 이 스테이지에서 쓸 변장 종수. 0이면 변장 없이 맨얼굴만 나온다. */
export function disguiseCountForStage(stage: number): number {
  if (stage >= 16) return 4;
  if (stage >= 13) return 3;
  if (stage >= 10) return 2;
  return 0;
}

/** 매치에 변장 일치까지 요구하는지. 변장이 붙는 구간과 항상 같이 간다. */
export function disguiseRequiredForStage(stage: number): boolean {
  return disguiseCountForStage(stage) > 0;
}

// ── 순차 숨김 스케줄 ──────────────────────────────────────────────────────────
// 절대 초가 아니라 **제한시간 대비 비율**로 정의한다. 제한시간이 스테이지 13에서 5초로
// 고정되기 때문에, "첫 숨김까지 N초" 같은 절대값을 쓰면 후반엔 4~5장만 숨겨지고 타이머가
// 만료돼 숨김 축이 사실상 죽는다.

/** 남은 타일 중 최대 몇 %까지 숨길 수 있는지. 나머지는 항상 노출돼 순수 추측을 막는다. */
export const HIDE_CAP_RATIO = 0.7;
/**
 * 이 이하로 남으면 추가 숨김을 멈춘다. 상한 70%만으로는 막바지가 안전하지 않다 —
 * 남은 4장이면 상한이 2라 2장이 노출되는데, 그 2장이 서로 다른 페어일 수 있어
 * 노출 정보가 매치에 아무 도움이 안 된다(스펙 AD-6).
 */
export const HIDE_FLOOR_TILES = 4;

/** 첫 숨김 전 안전 관찰 구간의 비율. 스테이지가 오를수록 줄어드는 게 후반 압박의 주 원천. */
export function graceRatioForStage(stage: number): number {
  return Math.max(0.15, 0.45 - (stage - GRACE_STAGE_LIMIT - 1) * 0.03);
}

/** 남은 타일 수 기준 숨김 상한(장). */
export function hideCapForRemaining(remaining: number): number {
  return Math.floor(remaining * HIDE_CAP_RATIO);
}

/** 스테이지 4부터 순차 숨김이 적용된다. 1~3은 온보딩 유예 구간. */
export function hideEnabledForStage(stage: number): boolean {
  return stage > GRACE_STAGE_LIMIT;
}
