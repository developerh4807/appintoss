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

/** 앱인토스 공식 테스트 광고그룹 ID. 실 ID가 주입되지 않았을 때의 폴백. */
export const TEST_AD_GROUP_IDS = {
  banner: "ait-ad-test-banner-id",
  rewardedContinue: "ait-ad-test-rewarded-id",
} as const;

import type { AdGroupIds } from "../types";

// 실 ID는 `.env.local`의 VITE_TOSS_AD_* 에서 온다(gitignore). 없으면 undefined.
const realBanner = import.meta.env.VITE_TOSS_AD_BANNER;
const realRewardedContinue = import.meta.env.VITE_TOSS_AD_REWARDED_CONTINUE;

// 실 ID가 둘 다 주입됐는지. 아래 AD_GROUP_IDS 분기에만 쓴다.
const hasRealIds = Boolean(realBanner && realRewardedContinue);

/**
 * 실제로 쓸 광고그룹 ID.
 *
 * 실 ID가 **둘 다** 주입됐을 때만 실 ID를 쓰고, 하나라도 비면 전부 테스트 ID로
 * 떨어진다 — "실 ID 하나 빠뜨리고 출시" 사고를 구조적으로 막는다.
 *
 * 필드별 폴백(`realBanner || TEST.banner`)으로 쓰면 안 된다. 그러면 한쪽만 채웠을 때
 * 실 배너 + 테스트 보상형이 섞인 채로 나가는데, 겉보기엔 광고가 뜨니 알아채기 어렵다.
 */
export const AD_GROUP_IDS: AdGroupIds = hasRealIds
  ? { banner: realBanner!, rewardedContinue: realRewardedContinue! }
  : TEST_AD_GROUP_IDS;
