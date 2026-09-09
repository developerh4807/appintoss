// [NEW 2026-09-09] 계약(AdGroupIds)을 맞추기 위한 자리표시자.
//
// Android 어댑터는 호출부가 넘긴 adGroupId를 통째로 무시하고, AdMob 광고단위를
// adIds.ts의 AD_IDS에서 직접 고른다(ads.tsx의 resolveRewardedAdId / attachBanner 참고).
// 그래서 여기 값이 무엇이든 Android 동작에는 영향이 없다 — 호출부가 플랫폼을
// 몰라도 되게 만드는 용도일 뿐이다.
import type { AdGroupIds } from "../types";

export const AD_GROUP_IDS: AdGroupIds = {
  banner: "android-unused-banner",
  rewardedContinue: "android-unused-rewarded",
};
