// [NEW 2026-08-21] 토스 플랫폼 구현 barrel.
// Vite alias가 `@platform` → 이 파일로 해석될 때만 @apps-in-toss/* 가 import 그래프에 들어간다.
export { useInAppAds, useBanner } from "./ads";
export { sharePayload } from "./share";
export {
  submitScore,
  openLeaderboard,
  canOpenLeaderboard,
} from "./leaderboard";
export { vibrate } from "./haptics";
export { Button, useDialog, useToast, PlatformProvider } from "./ui";
export { registerBackButton } from "./appLifecycle";
export type { BackHandler } from "../types";
