import {
  openGameCenterLeaderboard,
  submitGameCenterLeaderBoardScore,
} from "@apps-in-toss/web-framework";

// [MOVED 2026-08-21] 기존 src/game/leaderboard.ts 의 토스 게임센터 호출부.
// 점수 계산(scoreForRun)·티어(tierForStage)는 플랫폼 무관 순수 로직이라
// src/game/leaderboard.ts 에 그대로 남겼다.
//
// 조사 결과 확인된 제약(deferred-work.md ② 항목 참고):
// - 순위를 조회하는 API가 없다. openGameCenterLeaderboard()는 Promise<void>로
//   토스 웹뷰를 띄우기만 한다 — 결과 카드에 실제 등수를 표시할 수 없어서
//   개인 최고기록은 localStorage(useRunState.bestStage)가 원천이다.
// - 제출은 문자열 스칼라 하나뿐이고 미니앱당 리더보드는 1개다.
// - TossAds와 달리 isSupported()가 없다. 앱 버전 미지원 시 undefined를 반환하는 것이
//   유일한 가드라서, 호출부는 반환값을 확인해야 한다.
// - 게임 카테고리 등록 + 콘솔 승인 전에는 항상 LEADERBOARD_NOT_FOUND가 온다.
//   승인 전에도 게임이 정상 동작해야 하므로 이 모듈은 어떤 실패도 밖으로 던지지 않는다.

export const canOpenLeaderboard = true;

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
export async function openLeaderboard(): Promise<boolean> {
  try {
    await openGameCenterLeaderboard();
    return true;
  } catch (error) {
    console.error("리더보드 열기 실패:", error);
    return false;
  }
}
