// [NEW 2026-08-21] 구글 공식 테스트 광고 단위 ID.
//
// ⚠️ 실 광고 ID 발급은 AdMob 콘솔 로그인이 필요해 이 작업의 범위 밖이다
// (docs/plans/android-port.md 5️⃣ "자동화 경계", 7️⃣-2).
// 출시 전 반드시 콘솔에서 발급한 실 ID로 교체해야 한다 — 테스트 ID로 출시하면
// 수익이 0이고, 반대로 실 ID로 개발 중 클릭하면 무효 트래픽으로 계정이 정지된다.
//
// 출처: https://developers.google.com/admob/android/test-ads
export const TEST_AD_IDS = {
  banner: "ca-app-pub-3940256099942544/6300978111",
  rewarded: "ca-app-pub-3940256099942544/5224354917",
} as const;

/**
 * 실 광고 ID로 교체할 때 이 플래그를 false로 바꾼다.
 * initializeForTesting과 테스트 ID 사용 여부를 한 곳에서 통제한다.
 */
export const USE_TEST_ADS = true;
