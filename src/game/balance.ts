// PRD FR-3/FR-5/FR-7 밸런스 초안 — 정확한 수치는 플레이테스트로 조정 (addendum.md 참고)
const GRACE_STAGE_LIMIT = 3;
const GRACE_SECONDS = 15;
const TIME_DECREASE_PER_STAGE = 1;
const MIN_STAGE_SECONDS = 5;

export const MISMATCH_PENALTY_SECONDS = 3;
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
