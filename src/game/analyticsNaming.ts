import type { AnalyticsEventMap, AnalyticsEventName } from "../platform/types";

// [NEW 2026-09-11] 콘솔로 보낼 이벤트 이름 규칙 — 분석 축을 이름에 넣는다.
//
// 왜: 앱인토스 콘솔은 이벤트를 이름으로만 센다. 파라미터는 값 목록만 보이고 값별 발생 횟수는
// 집계하지 않는다(토스 담당자 공식 답변 — 개발자 커뮤니티 #4463). 원본 데이터 내보내기(CSV·API)도
// 일정 없는 백로그다. 그래서 "어느 스테이지에서 게임오버가 많나", "어떤 아이템을 많이 쓰나"처럼
// 값별로 봐야 하는 축은 이벤트 이름 뒤에 붙인다(run_over_s05_08, item_used_time_boost).
// 파라미터는 원본 값을 그대로 계속 보낸다 — 토스가 값별 집계를 내놓으면 바로 쓸 수 있고,
// 핵심 지표는 파라미터 조건을 걸 수 있다.
//
// 이름이 곧 계약이다: 구간 경계나 접미사를 바꾸면 콘솔에서 과거 데이터와 끊긴다. 그래서 밸런스
// (balance.ts)가 바뀌어도 구간은 따라 바뀌지 않게 상수로 박아 둔다.
// 조사·의사결정: notes/2026-09-11_토스-analytics-한계와-이벤트-이름-분할-설계.md

/**
 * 스테이지 구간. 초반 1~4는 한 칸씩(이탈이 몰리는 구간), 이후는 게임 설계 경계에 맞춰 묶는다 —
 * 1~3 유예(15초 고정), 13에서 제한시간 최저(5초), 티어 경계 5·9·14·20(leaderboard.ts TIERS).
 */
export function stageBucket(stage: number): string {
  if (stage <= 1) return "s01";
  if (stage <= 4) return `s0${stage}`;
  if (stage <= 8) return "s05_08";
  if (stage <= 13) return "s09_13";
  if (stage <= 19) return "s14_19";
  return "s20_up";
}

/**
 * 구간 첫 스테이지 — 여기에 도달할 때만 stage_reach를 보낸다. 구간 안의 스테이지마다 세면
 * 한 런이 여러 번 세어져 구간별 이탈(도달(B) − 도달(다음 B))을 정확히 구할 수 없다.
 */
export const STAGE_REACH_MARKS: readonly number[] = [1, 2, 3, 4, 5, 9, 14, 20];

export function isStageReachMark(stage: number): boolean {
  return STAGE_REACH_MARKS.includes(stage);
}

// 아이템 키(timeBoost) → 이벤트 이름용 snake_case(time_boost). 이벤트 이름 전체를 snake_case로 맞춘다.
const toSnakeCase = (value: string) =>
  value.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);

type SplitRules = {
  [K in AnalyticsEventName]?: (params: AnalyticsEventMap[K]) => string;
};

/** 이벤트별로 이름 뒤에 붙일 축. 여기 없는 이벤트는 기본 이름 그대로 나간다. */
const SPLIT_RULES: SplitRules = {
  stage_reach: (p) => String(p.stage).padStart(2, "0"),
  stage_fail: (p) => stageBucket(p.stage),
  run_over: (p) => stageBucket(p.reached_stage),
  continue_used: (p) => p.type,
  ad_shown: (p) => p.format,
  ad_click: (p) => p.format,
  share_result_click: (p) => (p.new_record ? "record" : "norecord"),
  item_used: (p) => toSnakeCase(p.kind),
};

/** 콘솔에 찍힐 log_name. 예: run_over + { reached_stage: 6 } → "run_over_s05_08" */
export function consoleEventName<K extends AnalyticsEventName>(
  name: K,
  params: AnalyticsEventMap[K],
): string {
  const split = SPLIT_RULES[name];
  return split ? `${name}_${split(params)}` : name;
}
