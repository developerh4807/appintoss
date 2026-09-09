// [NEW 2026-09-09] 토스 광고그룹 ID. Android의 adIds.ts와 같은 규칙을 따른다.
//
// 왜 env인가: repo가 public이라 실 ID를 소스에 두면 그대로 공개된다. 광고 ID는
// 비밀번호가 아니라 식별자(번들을 뜯으면 어차피 보인다)지만, 소스에 실 ID를
// 남기지 않는 것이 이 프로젝트의 기존 관례다(`04e304c`, AdMob 쪽과 동일).
//
// 왜 platform/toss/ 인가: 이 값들은 앱인토스 콘솔에서 발급한 토스 전용 개념이다.
// 예전엔 GameShell/PuzzlePage 같은 플랫폼 중립 파일에 상수로 있었는데, Android
// 어댑터는 넘겨받은 adGroupId를 통째로 무시하므로(android/ads.tsx의
// resolveRewardedAdId 참고) 공유 파일에 있을 이유가 없었다.
//
// [개편 2026-09-09] 테스트 ID 폴백을 제거했다 — 소스에 리터럴을 두지 않는다.
//
// 왜: 폴백이 `hasRealIds ? 실ID : TEST_AD_GROUP_IDS` 삼항의 else 브랜치였는데,
// Rollup/esbuild가 이 조건을 컴파일타임 상수로 접지 못해 **쓰이지 않는 테스트 ID
// 문자열이 릴리스 번들에 그대로 남았다**. 실행 시엔 실 ID를 썼지만(실광고 정상
// 노출), 앱인토스 심사가 번들 문자열을 스캔해 `ait-ad-test-*` 를 발견하고 반려했다
// (20260909-3 번들, "출시할 미니앱 번들에는 테스트용 광고 그룹 ID를 넣을 수 없어요").
//
// 그래서 값은 **전부** env에서만 온다. 소스에 리터럴이 없으면 번들에 남을 길도 없다.
// 테스트 광고로 실기기 검증을 하고 싶으면 `.env.local` 에 테스트 광고그룹 ID를
// 넣으면 된다 — 코드를 고칠 일이 아니다.
//
// "실 ID 하나 빠뜨리고 출시" 방지는 이제 vite.config.ts 의 빌드 타임 검증이 맡는다.
// 값이 비면 빌드가 실패하므로, 잘못된 번들이 만들어지는 것 자체가 불가능하다.
import type { AdGroupIds } from "../types";

/**
 * 실제로 쓸 광고그룹 ID. 값은 `.env.local` 의 VITE_TOSS_AD_* 에서 빌드 타임에 주입된다.
 *
 * non-null 단언이 안전한 이유: 토스 빌드는 vite.config.ts 가 두 값의 존재를 먼저
 * 검증하고, 하나라도 비면 빌드가 그 자리에서 실패한다.
 */
export const AD_GROUP_IDS: AdGroupIds = {
  banner: import.meta.env.VITE_TOSS_AD_BANNER!,
  rewardedContinue: import.meta.env.VITE_TOSS_AD_REWARDED_CONTINUE!,
};
