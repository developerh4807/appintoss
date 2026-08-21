// [NEW 2026-08-21] 햅틱 (4️⃣ — 사운드 대신 채택).
//
// 이 게임은 "틀리면 즉시 끝"인데 실패 피드백이 전부 시각 채널에 몰려 있다.
// navigator.vibrate는 에셋 0바이트이고 무음 모드에서도 동작해 사운드보다 도달률이 높다.
// Capacitor 웹뷰는 VIBRATE 권한이 기본 포함돼 별도 플러그인이 필요 없다.
export function vibrate(pattern: number | number[]): void {
  try {
    if (typeof navigator === "undefined" || !navigator.vibrate) return;
    navigator.vibrate(pattern);
  } catch (error) {
    // 일부 브라우저는 사용자 제스처 없이 호출하면 throw한다 — 피드백은 부가 요소라 무시한다.
    console.debug("햅틱 실패:", error);
  }
}
