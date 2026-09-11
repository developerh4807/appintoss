// [NEW 2026-08-21] Android(Play) 플랫폼 구현 barrel.
// 이 파일이 해석될 때 @apps-in-toss/* 는 import 그래프에 아예 진입하지 않는다.
export { useInAppAds, useBanner } from "./ads";
// Android 어댑터는 넘겨받은 adGroupId를 무시하고 adIds.ts의 AdMob 광고단위를
// 직접 고른다(ads.tsx의 resolveRewardedAdId 참고). 계약을 맞추기 위한 자리표시자다.
export { AD_GROUP_IDS } from "./adGroupIds";
export { sharePayload } from "./share";
export {
  submitScore,
  openLeaderboard,
  canOpenLeaderboard,
  readBestScore,
} from "./leaderboard";
export { vibrate } from "./haptics";
export { Button, useDialog, useToast, PlatformProvider } from "./ui";
export { registerBackButton } from "./appLifecycle";
export { logEvent, logScreen } from "./analytics";
export { isShareRewardSupported, openShareReward } from "./promotion";
export type { BackHandler } from "../types";
