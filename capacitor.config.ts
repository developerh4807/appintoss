import type { CapacitorConfig } from "@capacitor/cli";

// [NEW 2026-08-21] Capacitor 설정 (docs/plans/android-port.md 6️⃣ 3단계).
//
// webDir이 dist-android 인 것이 핵심이다 — 토스 번들(dist-toss)을 감싸면
// 앱인토스 SDK가 그대로 들어가 격리가 무의미해진다.
// 반드시 `npm run build:android` 로 만든 산출물을 감싼다.
const config: CapacitorConfig = {
  appId: "im.appintoss.matchingking",
  appName: "One Miss, Game Over",
  webDir: "dist-android",
  android: {
    // 웹뷰가 자체 배경을 그리기 전 잠깐 보이는 색 — surfaceBase(#FFF8EC)와 맞춰
    // 스플래시에서 게임 화면으로 넘어갈 때 흰 번쩍임을 없앤다.
    backgroundColor: "#FFF8EC",
  },
  plugins: {
    SplashScreen: {
      // 웹 스플래시(SplashScreen.tsx)가 이미 있으므로 네이티브 스플래시는 짧게 띄우고
      // 즉시 넘긴다 — 둘 다 길게 잡으면 스플래시가 두 번 보인다.
      launchShowDuration: 500,
      backgroundColor: "#FFF8EC",
      showSpinner: false,
      androidSpinnerStyle: "small",
    },
  },
};

export default config;
