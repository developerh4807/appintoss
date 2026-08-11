// PRD FR-3/FR-5/FR-7 밸런스 초안 — 정확한 수치는 플레이테스트로 조정 (addendum.md 참고)
const GRACE_STAGE_LIMIT = 3;
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
