// [UPDATED 2026-08-21] 구현이 @platform 어댑터로 이동했다.
// 호출부(GameShell/PuzzlePage/InAppAdsPage)의 import 경로를 유지하기 위한 얇은 재수출이다.
// 반환 형태 { isAdLoaded, isSupported, showAd, lastReward }는 양 플랫폼이 동일하게 지킨다.
export { useInAppAds } from "@platform";
