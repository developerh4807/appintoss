import {
  openGameCenterLeaderboard,
  submitGameCenterLeaderBoardScore,
} from "@apps-in-toss/web-framework";

// [NEW 2026-08-11] 앱인토스 게임센터 리더보드 얇은 어댑터.
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

/**
 * 점수를 리더보드에 제출한다. 실패는 전부 조용히 삼킨다 — 미지원 앱 버전, 콘솔 미승인,
 * 게임 프로필 미생성 중 어느 것도 게임 흐름을 막아선 안 된다.
 *
 * 게임 프로필이 없으면 PROFILE_NOT_FOUND가 오므로 플레이가 끝난 뒤에 호출한다.
 */
export async function submitScore(score: number): Promise<void> {
  try {
    const result = await submitGameCenterLeaderBoardScore({
      score: String(score),
    });

    // undefined = 앱 버전 미지원. statusCode !== "SUCCESS" = 미승인/프로필 없음/파싱 실패.
    if (!result) return;
    if (result.statusCode !== "SUCCESS") {
      console.info("리더보드 점수 제출 건너뜀:", result.statusCode);
    }
  } catch (error) {
    console.error("리더보드 점수 제출 실패:", error);
  }
}

/**
 * 토스 게임센터 리더보드 웹뷰를 연다. 순위를 코드로 읽어올 방법이 없어서
 * 유저가 등수를 보는 유일한 경로다.
 *
 * 호출하면 미니앱이 백그라운드로 전환되므로, 호출부는 먼저 게임 상태를 저장/일시정지해야 한다.
 */
export async function openLeaderboard(): Promise<void> {
  try {
    await openGameCenterLeaderboard();
  } catch (error) {
    console.error("리더보드 열기 실패:", error);
  }
}
