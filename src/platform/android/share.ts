import type { SharePayload } from "../types";

// [NEW 2026-08-21] Web Share API. Capacitor 웹뷰(Android Chrome)는 navigator.share를
// 지원하므로 별도 플러그인 없이 OS 공유 시트가 뜬다. 미지원 환경(데스크톱 브라우저 등)은
// 클립보드로 폴백한다 — 공유는 부가 기능이라 실패해도 게임 흐름을 막지 않는다.
export async function sharePayload(payload: SharePayload): Promise<void> {
  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ text: payload.message });
      return;
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(payload.message);
      return;
    }
  } catch (error) {
    // 사용자가 공유 시트를 닫으면 AbortError가 난다 — 정상 흐름이라 조용히 넘긴다.
    if (error instanceof Error && error.name === "AbortError") return;
    console.error("공유 실패:", error);
  }
}
