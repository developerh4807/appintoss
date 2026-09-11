import type { ShareRewardHandlers } from "../types";

// [NEW 2026-09-11] Play 빌드에는 토스 공유 리워드(친구 초대 보상)가 없다.
// isShareRewardSupported()가 false라 버튼이 안 뜨고, 재시도 사다리는 광고 단계에서 끝난다.
// 보상 없는 일반 공유(FR-19)는 share.ts 가 그대로 담당한다.
export function isShareRewardSupported(): boolean {
  return false;
}

export function openShareReward(handlers: ShareRewardHandlers): () => void {
  handlers.onClose({ rewarded: false });
  return () => {};
}
