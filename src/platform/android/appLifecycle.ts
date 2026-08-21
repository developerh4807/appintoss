import { App } from "@capacitor/app";

import type { BackHandler } from "../types";

// [NEW 2026-08-21] Android 하드웨어 뒤로가기 처리 (8️⃣④ "최소 기능 요건" 대응).
//
// Capacitor 기본 동작은 웹뷰 히스토리를 pop하는 것인데, 이 게임은 SPA라 히스토리가
// 쌓이지 않는다 — 그대로 두면 뒤로가기가 아무 반응도 없는 것처럼 보인다.
// "웹사이트를 그대로 감싼 껍데기"로 읽히는 대표적 신호라 명시적으로 처리한다.
//
// 게임 안에서는 화면 전환(뽑기 → 퍼즐)을 뒤로가기로 처리하고, 최상위 화면에서만
// 앱을 종료한다.


/**
 * 하드웨어 뒤로가기를 구독한다. 반환된 함수를 호출하면 구독이 해제된다.
 *
 * 웹 브라우저에서는 App 플러그인이 없어 no-op이다(dev 서버에서 터지면 안 된다).
 */
export function registerBackButton(handler: BackHandler): () => void {
  let removeListener: (() => void) | null = null;
  let cancelled = false;

  void App.addListener("backButton", () => {
    // handler가 false를 주면 최상위 화면이라는 뜻이므로 앱을 종료한다.
    if (!handler()) void App.exitApp();
  })
    .then((listener) => {
      // 구독이 완료되기 전에 cleanup이 돌면 즉시 해제한다(StrictMode 이중 마운트 대비).
      if (cancelled) {
        void listener.remove();
        return;
      }
      removeListener = () => void listener.remove();
    })
    .catch((error) => {
      console.debug("뒤로가기 구독 실패(웹 환경일 수 있음):", error);
    });

  return () => {
    cancelled = true;
    removeListener?.();
  };
}
