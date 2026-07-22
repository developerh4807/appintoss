// PRD FR-3/FR-5/FR-7 밸런스 초안 — 정확한 수치는 플레이테스트로 조정 (addendum.md 참고)
const GRACE_STAGE_LIMIT = 3;
const GRACE_SECONDS = 15;
const TIME_DECREASE_PER_STAGE = 1;
const MIN_STAGE_SECONDS = 5;

export const MISMATCH_PENALTY_SECONDS = 3;
// [UPDATED 2026-07-22] 스테이지별 2회에서 게임 전체(하루 단위) 3회로 변경 — 개발자 피드백,
// 소진 후엔 광고 시청으로만 이어할 수 있다. useGlobalRetryCap.ts 참고.
export const DAILY_FREE_RETRIES = 3;
export const CRITICAL_TIME_RATIO = 0.25;

export function initialSecondsForStage(stage: number): number {
  if (stage <= GRACE_STAGE_LIMIT) return GRACE_SECONDS;
  const decreased =
    GRACE_SECONDS - (stage - GRACE_STAGE_LIMIT) * TIME_DECREASE_PER_STAGE;
  return Math.max(MIN_STAGE_SECONDS, decreased);
}
