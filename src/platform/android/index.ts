// [NEW 2026-08-21] Android(Play) 플랫폼 구현 barrel.
// 이 파일이 해석될 때 @apps-in-toss/* 는 import 그래프에 아예 진입하지 않는다.
export { useInAppAds, useBanner } from "./ads";
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
export type { BackHandler } from "../types";
