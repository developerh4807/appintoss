// [UPDATED 2026-08-21] 플랫폼 호출(제출/열기)은 @platform 어댑터로 옮겼고,
// 이 파일에는 플랫폼 무관 순수 로직(점수 압축·티어)만 남겼다.
// 호출부가 import 경로를 바꾸지 않도록 어댑터 구현을 그대로 재수출한다.
export {
  submitScore,
  openLeaderboard,
  canOpenLeaderboard,
} from "@platform";

// [NEW 2026-08-11] 리더보드 설계 배경.
//
// 조사 결과 확인된 제약(deferred-work.md ② 항목 참고):
// - 순위를 조회하는 API가 없다. openGameCenterLeaderboard()는 Promise<void>로
//   토스 웹뷰를 띄우기만 한다 — 결과 카드에 실제 등수를 표시할 수 없어서
//   개인 최고기록은 localStorage(useRunState.bestStage)가 원천이다.
// - 제출은 문자열 스칼라 하나뿐이고 미니앱당 리더보드는 1개다. 그래서 기억력·반응속도를
//   하나의 점수로 압축한다(scoreForRun 참고).
// - TossAds와 달리 isSupported()가 없다. 앱 버전 미지원 시 undefined를 반환하는 것이
//   유일한 가드라서, 호출부는 반환값을 확인해야 한다.
// - 게임 카테고리 등록 + 콘솔 승인 전에는 항상 LEADERBOARD_NOT_FOUND가 온다.
//   승인 전에도 게임이 정상 동작해야 하므로 이 모듈은 어떤 실패도 밖으로 던지지 않는다.

// 스테이지 가중치. 도달 스테이지가 점수의 지배 항이고 남은 시간은 동점자 구분용 보너스다.
// 스테이지당 최대 보너스(초기 제한시간 15초)보다 충분히 커서 "더 멀리 간 사람이 항상 위"가 보장된다.
const STAGE_WEIGHT = 1000;

/**
 * 런 결과를 리더보드 제출용 단일 점수로 압축한다.
 *
 * 반드시 "높을수록 좋음" 단조증가 정수여야 한다 — 콘솔에서 정렬 기준을 한 번 정하면
 * 바꾸기 번거롭고, 반응속도를 ms로 그대로 쓰면 "낮을수록 좋음"이 돼버린다.
 */
export function scoreForRun(bestStage: number, secondsLeft = 0): number {
  const stage = Math.max(1, Math.floor(bestStage));
  const bonus = Math.max(0, Math.floor(secondsLeft));
  return stage * STAGE_WEIGHT + bonus;
}

// [NEW 2026-08-11] FR-18 동물 티어 — 도달 스테이지를 등급으로 은유한다.
// "반응속도 나이" 프레이밍은 Brain Age/Lumosity가 받은 비과학성 비판과 같은 범주라
// PRD §4.4에서 명시적으로 기각됐다. 티어는 과학적 측정을 함의하지 않는 재미 요소일 뿐이다.
// [ASSUMPTION] 구간 경계는 플레이테스트로 조정 — ①의 난이도 커브 확정 후 재검토.
const TIERS = [
  { minStage: 20, label: "치타급", icon: "🐆" },
  { minStage: 14, label: "여우급", icon: "🦊" },
  { minStage: 9, label: "사슴급", icon: "🦌" },
  { minStage: 5, label: "하마급", icon: "🦛" },
  { minStage: 1, label: "나무늘보급", icon: "🦥" },
] as const;

export interface Tier {
  label: string;
  icon: string;
}

export function tierForStage(stage: number): Tier {
  // 위에서부터 내려오며 처음 만족하는 구간이 해당 티어다. 마지막 항목이 minStage 1이라
  // 항상 매치되지만, 손상된 입력(0/음수)에 대비해 fallback을 남긴다.
  const matched = TIERS.find((tier) => stage >= tier.minStage);
  return matched ?? TIERS[TIERS.length - 1];
}
